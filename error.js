export class CustomError extends Error {
  constructor(name, details) {
    super(name);
    this.name = name;
    this.serialize = () => {
      return {
        statusCode: this.statusCode || 500,
        message: this.name,
      };
    };
  }
}

export class NotFound extends CustomError {
  constructor(name = "Not found", details) {
    super(name, details);
    this.statusCode = 404;
    this.serialize = () => {
      return {
        statusCode: this.statusCode,
        message: this.name,
        details: this.details,
      };
    };
  }
}
