import React, { useState } from 'react';
import axios from 'axios';

export default function AgeCalculator() {
  const [birthDate, setBirthDate] = useState('');
  const [age, setAge] = useState<number | null>(null);

  const calculateAge = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/age-generator', {
        birthDate,
      });
      setAge(response.data.age);
    } catch (error) {
      console.error('Error calculating age:', error);
    }
  };

  return (
    <div className="age-calculator">
      <h2>Age Calculator</h2>
      <input
        type="date"
        value={birthDate}
        onChange={(e) => setBirthDate(e.target.value)}
      />
      <button onClick={calculateAge}>Calculate Age</button>
      {age !== null && <p>Your age: {age} years old</p>}
    </div>
  );
}
