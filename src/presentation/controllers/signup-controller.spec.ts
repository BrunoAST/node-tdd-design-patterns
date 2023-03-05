import { InvalidParamError, MissingParamError } from '../errors';
import { ServerError } from '../errors/server-error';
import type { EmailValidator } from '../protocols';
import { SignupController } from './signup';

interface SutTypes {
  sut: SignupController;
  emailValidatorStub: EmailValidator;
}

const makeSut = (): SutTypes => {
  class EmailValidatorStub implements EmailValidator {
    isValid (email: string): boolean {
      return true;
    }
  }

  const emailValidatorStub = new EmailValidatorStub();

  const sut = new SignupController(emailValidatorStub);

  return {
    sut,
    emailValidatorStub
  };
};

describe('Signup Controller', () => {
  describe('Validation of required fields', () => {
    test.each([
      {
        body: {
          email: 'any_email@mail.com',
          password: 'any_password',
          passwordConfirmation: 'any_password'
        },
        field: 'name'
      },
      {
        body: {
          name: 'any_name',
          password: 'any_password',
          passwordConfirmation: 'any_password'
        },
        field: 'email'
      },
      {
        body: {
          name: 'any_name',
          email: 'any_email@emal.com',
          passwordConfirmation: 'any_password'
        },
        field: 'password'
      },
      {
        body: {
          name: 'any_name',
          email: 'any_email@emal.com',
          password: 'any_password'
        },
        field: 'passwordConfirmation'
      }
    ])('Should return 400 if no $field is provided', ({ body, field }) => {
      const { sut } = makeSut();
      const httpRequest = { body };
      const httpResponse = sut.handle(httpRequest);

      expect(httpResponse.statusCode).toBe(400);
      expect(httpResponse.body).toEqual(new MissingParamError(field));
    });
  });

  describe('Email validation', () => {
    test('Should return 400 if an invalid email is provided', () => {
      const { sut, emailValidatorStub } = makeSut();

      jest.spyOn(emailValidatorStub, 'isValid').mockReturnValue(false);

      const httpRequest = {
        body: {
          name: 'any_name',
          email: 'invalid_email@mail.com',
          password: 'any_password',
          passwordConfirmation: 'any_password'
        }
      };
      const httpResponse = sut.handle(httpRequest);

      expect(httpResponse.statusCode).toBe(400);
      expect(httpResponse.body).toEqual(new InvalidParamError('email'));
    });

    test('Should call EmailValidator with correct email', () => {
      const { sut, emailValidatorStub } = makeSut();

      const isValidSpy = jest.spyOn(emailValidatorStub, 'isValid');

      const httpRequest = {
        body: {
          name: 'any_name',
          email: 'any_email@mail.com',
          password: 'any_password',
          passwordConfirmation: 'any_password'
        }
      };
      sut.handle(httpRequest);

      expect(isValidSpy).toHaveBeenCalledWith('any_email@mail.com');
    });

    test('Should return 500 if EmailValidator throws', () => {
      class EmailValidatorStub implements EmailValidator {
        isValid (email: string): boolean {
          throw new Error();
        }
      }

      const emailValidatorStub = new EmailValidatorStub();
      const sut = new SignupController(emailValidatorStub);

      const httpRequest = {
        body: {
          name: 'any_name',
          email: 'any_email@mail.com',
          password: 'any_password',
          passwordConfirmation: 'any_password'
        }
      };
      const httpResponse = sut.handle(httpRequest);

      expect(httpResponse.statusCode).toBe(500);
      expect(httpResponse.body).toEqual(new ServerError());
    });
  });
});
