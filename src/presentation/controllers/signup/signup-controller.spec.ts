import { InvalidParamError, MissingParamError } from '../../errors';
import { ServerError } from '../../errors/server-error';
import { SignupController } from './signup';
import type { AccountModel, AddAccount, AddAccountModel, EmailValidator } from './signup-protocols';

const makeEmailValidator = (): EmailValidator => {
  class EmailValidatorStub implements EmailValidator {
    isValid (email: string): boolean {
      return true;
    }
  }

  return new EmailValidatorStub();
};

const makeAddAccount = (): AddAccount => {
  class AddAccountStub implements AddAccount {
    add (account: AddAccountModel): AccountModel {
      const fakeAccount = {
        id: 'valid_id',
        name: 'valid_name',
        email: 'valid_email@email.com',
        password: 'valid_password'
      };

      return fakeAccount;
    }
  }

  return new AddAccountStub();
};

interface SutTypes {
  sut: SignupController;
  emailValidatorStub: EmailValidator;
  addAccountStub: AddAccount;
}

const makeSut = (): SutTypes => {
  const emailValidatorStub = makeEmailValidator();
  const addAccountStub = makeAddAccount();

  const sut = new SignupController(emailValidatorStub, addAccountStub);

  return {
    sut,
    emailValidatorStub,
    addAccountStub
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
      const { sut, emailValidatorStub } = makeSut();
      jest.spyOn(emailValidatorStub, 'isValid').mockImplementation(() => {
        throw new Error();
      });

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

  describe('Password validation', () => {
    test('Should return 400 if password confirmation failed', () => {
      const { sut } = makeSut();

      const httpRequest = {
        body: {
          name: 'any_name',
          email: 'invalid_email@mail.com',
          password: 'any_password',
          passwordConfirmation: 'invalid_password'
        }
      };
      const httpResponse = sut.handle(httpRequest);

      expect(httpResponse.statusCode).toBe(400);
      expect(httpResponse.body).toEqual(new InvalidParamError('passwordConfirmation'));
    });
  });

  describe('AddAccount integration', () => {
    test('Should call AddAccount with correct values', () => {
      const { sut, addAccountStub } = makeSut();

      const addSpy = jest.spyOn(addAccountStub, 'add');

      const httpRequest = {
        body: {
          name: 'any_name',
          email: 'any_email@mail.com',
          password: 'any_password',
          passwordConfirmation: 'any_password'
        }
      };
      sut.handle(httpRequest);

      expect(addSpy).toHaveBeenCalledWith({
        name: 'any_name',
        email: 'any_email@mail.com',
        password: 'any_password'
      });
    });

    test('Should return 500 if AddAccount throws', () => {
      const { sut, addAccountStub } = makeSut();
      jest.spyOn(addAccountStub, 'add').mockImplementation(() => {
        throw new Error();
      });

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
