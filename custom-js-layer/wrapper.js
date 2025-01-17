"use strict";
/*
 * Copyright Splunk Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("@opentelemetry/api");
const core_1 = require("@opentelemetry/core");
const resources_1 = require("@opentelemetry/resources");
const resource_detector_aws_1 = require("@opentelemetry/resource-detector-aws");
const instrumentation_aws_lambda_1 = require("@opentelemetry/instrumentation-aws-lambda");
const otel_1 = require("@splunk/otel");
const instrumentations_1 = require("@splunk/otel/lib/instrumentations");
// configure lambda logging
const logLevel = (0, core_1.getEnv)().OTEL_LOG_LEVEL;
api_1.diag.setLogger(new api_1.DiagConsoleLogger(), logLevel);
// configure flush timeout
let forceFlushTimeoutMillisEnv = parseInt(
  process.env.OTEL_INSTRUMENTATION_AWS_LAMBDA_FLUSH_TIMEOUT || ""
);
const forceFlushTimeoutMillis = isNaN(forceFlushTimeoutMillisEnv)
  ? 30000
  : forceFlushTimeoutMillisEnv;
api_1.diag.debug(`ForceFlushTimeout set to: ${forceFlushTimeoutMillis}`);
// AWS lambda instrumentation response hook for Server-Timing support
function getEnvBoolean(key, defaultValue = true) {
  const value = process.env[key];
  if (value === undefined) {
    return defaultValue;
  }
  if (["false", "no", "0"].indexOf(value.trim().toLowerCase()) >= 0) {
    return false;
  }
  return true;
}
function appendHeader(response, header, value) {
  const existing = response[header];
  if (existing === undefined) {
    response[header] = value;
    return;
  }
  if (typeof existing === "string") {
    response[header] = `${existing}, ${value}`;
    return;
  }
  if (Array.isArray(existing)) {
    existing.push(value);
  }
}
// an educated guess - how to check if particular response is an API Gateway event?
function isApiGatewayResponse(data) {
  return data && data.res && data.res.body && data.res.statusCode;
}
const responseHook = (span, data) => {
  const serverTimingEnabled = getEnvBoolean(
    "SPLUNK_TRACE_RESPONSE_HEADER_ENABLED",
    true
  );
  const spanContext = span.spanContext();
  if (
    !isApiGatewayResponse(data) ||
    !serverTimingEnabled ||
    !(0, api_1.isSpanContextValid)(spanContext)
  ) {
    return;
  }
  if (!data.res.headers) {
    data.res.headers = {};
  }
  const { traceFlags, traceId, spanId } = spanContext;
  const sampled =
    (traceFlags & api_1.TraceFlags.SAMPLED) === api_1.TraceFlags.SAMPLED;
  const flags = sampled ? "01" : "00";
  appendHeader(
    data.res.headers,
    "Access-Control-Expose-Headers",
    "Server-Timing"
  );
  appendHeader(
    data.res.headers,
    "Server-Timing",
    `traceparent;desc="00-${traceId}-${spanId}-${flags}"`
  );
};
const instrumentations = [
  new instrumentation_aws_lambda_1.AwsLambdaInstrumentation({
    responseHook,
  }),
  ...(0, instrumentations_1.getInstrumentations)(),
];
async function initializeProvider() {
  const resource = await (0, resources_1.detectResources)({
    detectors: [
      resource_detector_aws_1.awsLambdaDetector,
      resources_1.envDetector,
      resources_1.processDetector,
    ],
  });
  const tracerConfig = {
    resource,
    forceFlushTimeoutMillis,
  };
  (0, otel_1.start)({
    tracing: { tracerConfig: tracerConfig, instrumentations: instrumentations },
  });
}
initializeProvider();
