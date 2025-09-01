declare module '../parsers/excelParser.js' {
  export interface ParsedCargo {
    volume: number;
    weight: number;
    length: number;
    additionalInfo: string;
  }

  export interface ParsedOrder {
    orderNumber: string;
    orderDate: string;
    orderTime: string;
    customerName: string;
    deliveryDate: string;
    deliveryTime: string;
    deliveryId: string;
  }

  export interface ParsedRoute {
    date: string;
    region: string;
    time: string;
    type: string;
    number: string | null;
  }

  export interface ParsedRowData {
    route: ParsedRoute;
    cargo: ParsedCargo;
    order: ParsedOrder;
    company: string;
    rawData: string[];
  }

  export class ExcelParser {
    static parseCargo(cargoData: string): ParsedCargo | null;
    static parseOrder(orderData: string): ParsedOrder | null;
    static parseRoute(routeInfo: string): ParsedRoute;
    static parseRow(rowData: string[]): ParsedRowData | null;
    static validate(parsedData: ParsedRowData): boolean;
    static format(parsedData: ParsedRowData): string;
  }

  export default ExcelParser;
}
