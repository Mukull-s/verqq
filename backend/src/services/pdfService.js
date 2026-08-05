const pdfParse = require('pdf-parse');
const { callOpenRouter } = require('./openRouterService');

/**
 * Process a PDF buffer and extract its text content
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @returns {Promise<string>} - Extracted text from the PDF
 */
async function processPDF(pdfBuffer) {
  try {
    const data = await pdfParse(pdfBuffer);
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Extract structured resume profile using OpenRouter / Nemotron
 * @param {string} resumeText - Extracted raw text from resume
 * @returns {Promise<Object>} - Structured resume profile JSON
 */
async function extractResumeProfile(resumeText) {
  const prompt = `Analyze the following raw resume text and extract its skills, projects, and experiences in a clean, structured JSON format.
  
Resume Text:
${resumeText}

You must return a valid JSON object matching this schema exactly:
{
  "skills": ["string"],
  "projects": [
    {
      "name": "string",
      "technologies": ["string"],
      "summary": "string"
    }
  ],
  "experience": [
    {
      "role": "string",
      "company": "string",
      "summary": "string"
    }
  ]
}

Ensure to output ONLY valid JSON. No additional text, markdown backticks, or notes.`;

  try {
    const messages = [{ role: 'user', content: prompt }];
    const responseText = await callOpenRouter(messages, true);
    
    let cleanJson = responseText.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.substring(7);
    }
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.substring(3);
    }
    if (cleanJson.endsWith('```')) {
      cleanJson = cleanJson.substring(0, cleanJson.length - 3);
    }
    
    return JSON.parse(cleanJson.trim());
  } catch (error) {
    console.error('Error generating structured resume profile via OpenRouter:', error);
    return { skills: [], projects: [], experience: [] };
  }
}

module.exports = {
  processPDF,
  extractResumeProfile
}; 