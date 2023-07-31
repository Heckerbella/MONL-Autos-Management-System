import {db} from './prismaClient';
import * as ExcelJS from 'exceljs';

export async function readExcelAndSeedDatabase() {
  const workbook = new ExcelJS.Workbook();

  try {
    await workbook.xlsx.readFile('./job-material.xlsx');
    const worksheet = workbook.getWorksheet('ItemMasterList@2023-May-08 18_2'); // Replace 'Sheet1' with the actual sheet name in your Excel file

    // Use the `getSheetValues` method and cast to the correct type
    const rows = worksheet.getSheetValues() as Array<ExcelJS.CellValue[]>;
    // console.log(rows)
    const dataToSeed = [];

    for (const row of rows) {
      if (Array.isArray(row)) {
        const nameCell: ExcelJS.CellValue = row[3]; // Assuming productName is in column C (index 2)
        const costCell: ExcelJS.CellValue = row[4]; // Assuming productCost is in column D (index 3)

        if (typeof nameCell === 'string' && typeof costCell === 'number') {
          const productName: string = nameCell;
          const productCost: number = costCell;

          dataToSeed.push({ productName, productCost });
        }
      }
    }

    // Use Prisma Client to insert data into your database
    await db.jobMaterial.createMany({
      data: dataToSeed,
      skipDuplicates: true, // Optional, skips inserting duplicates
    });

    console.log('Data has been successfully seeded.');
  } catch (error) {
    console.error('Error while seeding data:', error);
  } finally {
    await db.$disconnect();
  }
}

// readExcelAndSeedDatabase();
