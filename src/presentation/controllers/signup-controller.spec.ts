import { MissingParamError } from '../errors/missing-param-error';
import { SignupController } from './signup';

const makeSut = (): SignupController => {
  return new SignupController();
};

describe('Signup Controller', () => {
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
    const sut = makeSut();
    const httpRequest = { body };
    const httpResponse = sut.handle(httpRequest);

    expect(httpResponse.statusCode).toBe(400);
    expect(httpResponse.body).toEqual(new MissingParamError(field));
  });
});
