// Simple NLP processor (can be enhanced with NLTK Python integration)

exports.extractSymptoms = (text) => {
  const commonSymptoms = [
    'fever', 'headache', 'cough', 'cold', 'fatigue',
    'nausea', 'vomiting', 'diarrhea', 'body ache',
    'sore throat', 'shortness of breath', 'dizziness'
  ];

  const foundSymptoms = [];
  const lowerText = text.toLowerCase();

  commonSymptoms.forEach(symptom => {
    if (lowerText.includes(symptom)) {
      foundSymptoms.push(symptom);
    }
  });

  return foundSymptoms;
};

exports.calculateSeverity = (symptoms) => {
  // Simple severity calculation based on symptom count
  const severity = Math.min(10, symptoms.length * 2);
  return severity;
};

exports.normalizeSymptoms = (symptoms) => {
  // Normalize symptom names
  const normalizedSymptoms = symptoms.map(sym => {
    const mappings = {
      'head pain': 'headache',
      'temperature': 'fever',
      'flu': 'cold',
      'weakness': 'fatigue'
    };
    return mappings[sym] || sym;
  });
  return normalizedSymptoms;
};