import type { Dayjs } from 'dayjs';
export interface PersonalData {
    lastName: string;
    firstName: string;
    patronymic: string;
    birthDate: Dayjs | null;
}
export interface ContractData {
    driverLicenseNumber: string;
    leaseAgreementNumber: string;
}
export interface Passport {
    series: string;
    number: string;
    issuedBy: string;
    departmentCode: string;
    registrationAddress: string;
    issueDate: Dayjs | null;
}
export interface Vehicle {
    make: string;
    model: string;
    licensePlate: string;
    vin: string;
    year: string;
    type: string;
    chassis: string;
    bodyColor: string;
    bodyNumber: string;
    ptsNumber: string;
    stsNumber: string;
    stsIssueInfo: string;
}
//# sourceMappingURL=types.d.ts.map