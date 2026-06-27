import { StudentRecord } from './types';

export function getSampleRecords(): StudentRecord[] {
  return [
    {
      id: '23FPA09511',
      studentName: 'Ahmad Khan',
      fatherName: 'Muhammad Khan',
      phoneNumber: '03001234567',
      registrationId: '23FPA09511',
      lmsPasswordId: 'ahmad@aiou',
      cmsPasswordId: 'aiou8601',
      admissionYear: '2025',
      programSelected: 'B.Ed (1.5 Years)',
      semesterType: 'Autumn',
      semesters: [
        {
          semesterNumber: 1,
          courses: [
            { code: '8601', assignment: true, workshop: true, quiz: true, assignment1: true, assignment2: true },
            { code: '8602', assignment: true, workshop: true, quiz: true, assignment1: true, assignment2: true },
            { code: '8603', assignment: true, workshop: true, quiz: true, assignment1: true, assignment2: true },
            { code: '8604', assignment: false, workshop: true, quiz: false, assignment1: true, assignment2: false },
            { code: '8605', assignment: false, workshop: false, quiz: false, assignment1: false, assignment2: false },
            { code: '8606', assignment: false, workshop: false, quiz: false, assignment1: false, assignment2: false }
          ]
        },
        {
          semesterNumber: 2,
          courses: [
            { code: '', assignment: false, workshop: false, quiz: false, assignment1: false, assignment2: false },
            { code: '', assignment: false, workshop: false, quiz: false, assignment1: false, assignment2: false },
            { code: '', assignment: false, workshop: false, quiz: false, assignment1: false, assignment2: false },
            { code: '', assignment: false, workshop: false, quiz: false, assignment1: false, assignment2: false },
            { code: '', assignment: false, workshop: false, quiz: false, assignment1: false, assignment2: false },
            { code: '', assignment: false, workshop: false, quiz: false, assignment1: false, assignment2: false }
          ]
        },
        {
          semesterNumber: 3,
          courses: [
            { code: '', assignment: false, workshop: false, quiz: false, assignment1: false, assignment2: false },
            { code: '', assignment: false, workshop: false, quiz: false, assignment1: false, assignment2: false },
            { code: '', assignment: false, workshop: false, quiz: false, assignment1: false, assignment2: false },
            { code: '', assignment: false, workshop: false, quiz: false, assignment1: false, assignment2: false },
            { code: '', assignment: false, workshop: false, quiz: false, assignment1: false, assignment2: false },
            { code: '', assignment: false, workshop: false, quiz: false, assignment1: false, assignment2: false }
          ]
        }
      ],
      totalReceivable: 24500,
      paymentsList: [
        { id: 'pay-1', date: '2025-10-15', amount: 15000 },
        { id: 'pay-2', date: '2026-02-10', amount: 5000 }
      ],
      serviceChargesAmount: 1200,
      remarks: 'Requires physical workshop guides for semester 2',
      serviceEnrollment: true,
      serviceWorkshops: true,
      serviceQuiz: true,
      serviceAssignments: false,
      servicePhysicalWorkshop: true,
      serviceResearchReport: false,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '24SPA08412',
      studentName: 'Sana Fatima',
      fatherName: 'Abdul Rehman',
      phoneNumber: '03159876543',
      registrationId: '24SPA08412',
      lmsPasswordId: 'sana@9911',
      cmsPasswordId: 'cms#sana',
      admissionYear: '2026',
      programSelected: 'B.A Admission',
      semesterType: 'Spring',
      semesters: [
        {
          semesterNumber: 1,
          courses: [
            { code: '401', assignment: true, workshop: true, quiz: true, assignment1: true, assignment2: true },
            { code: '402', assignment: true, workshop: true, quiz: true, assignment1: true, assignment2: true },
            { code: '403', assignment: true, workshop: true, quiz: true, assignment1: true, assignment2: true },
            { code: '404', assignment: true, workshop: true, quiz: true, assignment1: true, assignment2: true },
            { code: '405', assignment: true, workshop: true, quiz: true, assignment1: true, assignment2: true },
            { code: '406', assignment: true, workshop: true, quiz: true, assignment1: true, assignment2: true }
          ]
        },
        {
          semesterNumber: 2,
          courses: [
            { code: '', assignment: false, workshop: false, quiz: false, assignment1: false, assignment2: false },
            { code: '', assignment: false, workshop: false, quiz: false, assignment1: false, assignment2: false },
            { code: '', assignment: false, workshop: false, quiz: false, assignment1: false, assignment2: false },
            { code: '', assignment: false, workshop: false, quiz: false, assignment1: false, assignment2: false },
            { code: '', assignment: false, workshop: false, quiz: false, assignment1: false, assignment2: false },
            { code: '', assignment: false, workshop: false, quiz: false, assignment1: false, assignment2: false }
          ]
        },
        {
          semesterNumber: 3,
          courses: [
            { code: '', assignment: false, workshop: false, quiz: false, assignment1: false, assignment2: false },
            { code: '', assignment: false, workshop: false, quiz: false, assignment1: false, assignment2: false },
            { code: '', assignment: false, workshop: false, quiz: false, assignment1: false, assignment2: false },
            { code: '', assignment: false, workshop: false, quiz: false, assignment1: false, assignment2: false },
            { code: '', assignment: false, workshop: false, quiz: false, assignment1: false, assignment2: false },
            { code: '', assignment: false, workshop: false, quiz: false, assignment1: false, assignment2: false }
          ]
        },
        {
          semesterNumber: 4,
          courses: [
            { code: '', assignment: false, workshop: false, quiz: false, assignment1: false, assignment2: false },
            { code: '', assignment: false, workshop: false, quiz: false, assignment1: false, assignment2: false },
            { code: '', assignment: false, workshop: false, quiz: false, assignment1: false, assignment2: false },
            { code: '', assignment: false, workshop: false, quiz: false, assignment1: false, assignment2: false },
            { code: '', assignment: false, workshop: false, quiz: false, assignment1: false, assignment2: false },
            { code: '', assignment: false, workshop: false, quiz: false, assignment1: false, assignment2: false }
          ]
        }
      ],
      totalReceivable: 18000,
      paymentsList: [
        { id: 'pay-3', date: '2026-03-01', amount: 18000 }
      ],
      serviceChargesAmount: 800,
      remarks: 'Full fees paid. Outstanding candidate.',
      serviceEnrollment: true,
      serviceWorkshops: false,
      serviceQuiz: false,
      serviceAssignments: false,
      servicePhysicalWorkshop: false,
      serviceResearchReport: false,
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}
