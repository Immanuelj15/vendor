export const ocrService = {
  
  async extractBillData(fileUrl) {
    // This is an abstract extension point for future OCR integration (Google Vision, AWS Textract)
    // For now, it returns a mock stub structure so the frontend/admin can see where it slots in.
    return {
      status: 'MOCK_SUCCESS',
      confidence: 85,
      extractedData: {
        billNumber: 'MOCK-12345',
        billDate: new Date(),
        storeName: 'Mock Extracted Store',
        purchaseAmount: 1500,
        taxAmount: 75,
      },
      rawText: 'This is a mock OCR extraction response.'
    };
  }
};
