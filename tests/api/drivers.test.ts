import request from 'supertest';
import app from '../../src/app.js'; // Импортируем наше готовое приложение
import type { Knex } from 'knex';

// Мы не можем импортировать knexInstance статически.
// Поэтому мы объявим переменную, а получим ее значение динамически.
let knexInstance: Knex;

describe('POST /api/drivers', () => {

  // Перед всеми тестами в этом файле мы динамически загрузим наш knex-модуль.
  beforeAll(async () => {
    const dbModule = await import('../../src/database/knex.js');
    knexInstance = dbModule.knexInstance;
  });

  // Перед каждым тестом чистим таблицу, чтобы тесты не влияли друг на друга
  beforeEach(async () => {
    await knexInstance('drivers').del();
  });

  // После всех тестов закрываем соединение с БД
  afterAll(async () => {
    await knexInstance.destroy();
  });

  it('should create a new driver and return 201 status', async () => {
    const mockDriver = {
      personalData: {
        lastName: 'Тестов',
        firstName: 'Тест',
        patronymic: 'Тестович',
        birthDate: '1990-01-01',
      },
      passport: {
        series: '1234',
        number: '567890',
        issuedBy: 'Тестовым отделом',
        issueDate: '2010-01-01',
        departmentCode: '123-456',
        registrationAddress: 'г. Тест, ул. Тестовая, д. 1',
      },
      vehicle: {
        make: 'TestMake',
        model: 'TestModel',
        licensePlate: 'A123BC78',
        vin: 'TESTVIN1234567890',
        year: 2020,
        type: 'Тестовый тип',
        chassis: 'TESTCHASSIS',
        bodyColor: 'Тестовый цвет',
        bodyNumber: 'TESTBODY',
        ptsNumber: 'TESTPTS',
        stsNumber: 'TESTSTS',
        stsIssueInfo: 'Тестовым ГИБДД',
      },
    };

    const response = await request(app)
      .post('/api/drivers')
      .send(mockDriver);

    // 1. Проверяем статус ответа
    expect(response.status).toBe(201);

    // 2. Проверяем, что в ответе есть ID
    expect(response.body).toHaveProperty('id');

    // 3. Проверяем, что данные в ответе соответствуют отправленным
    expect(response.body.personalData.lastName).toBe(mockDriver.personalData.lastName);

    // 4. Проверяем, что запись реально появилась в базе
    const driverInDb = await knexInstance('drivers').where({ id: response.body.id }).first();
    expect(driverInDb).toBeDefined();
    expect(driverInDb.firstName).toBe(mockDriver.personalData.firstName);
  });

  it('should return 400 status if lastName is missing', async () => {
    const mockDriverWithNoLastName = {
      personalData: {
        // lastName отсутствует
        firstName: 'Тест',
        birthDate: '1990-01-01',
      },
      passport: {
        series: '1234',
        number: '567890',
        issuedBy: 'Тестовым отделом',
        issueDate: '2010-01-01',
        departmentCode: '123-456',
        registrationAddress: 'г. Тест, ул. Тестовая, д. 1',
      },
      vehicle: {
        make: 'TestMake',
        model: 'TestModel',
        licensePlate: 'A123BC78_2', // Уникальное значение
        vin: 'TESTVIN1234567890_2', // Уникальное значение
        year: 2020,
        type: 'Тестовый тип',
        stsIssueInfo: 'Тестовым ГИБДД',
      },
    };

    const response = await request(app)
      .post('/api/drivers')
      .send(mockDriverWithNoLastName);

    // Ожидаем ошибку 400 Bad Request
    expect(response.status).toBe(400);
  });

  it('should return 400 status if birthDate is invalid', async () => {
    const mockDriver = {
      personalData: {
        lastName: 'Тестов',
        firstName: 'Тест',
        birthDate: 'это-не-дата', // Некорректная дата
      },
      // ...остальные обязательные поля
      passport: { series: '1', number: '1', issuedBy: '1', issueDate: '2010-01-01', departmentCode: '1' },
      vehicle: { make: '1', model: '1', licensePlate: 'A123BC78_3', vin: 'TESTVIN1234567890_3', year: 2020, type: '1', bodyColor: '1', ptsNumber: '1', stsNumber: '1', stsIssueInfo: '1' },
    };

    const response = await request(app)
      .post('/api/drivers')
      .send(mockDriver);

    expect(response.status).toBe(400);
    // Проверяем, что в ответе есть ошибка именно для поля birthDate
    expect(response.body.errors[0].path).toBe('personalData.birthDate');
  });
});