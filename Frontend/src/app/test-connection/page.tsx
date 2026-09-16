'use client';
import { useEffect } from 'react';

export default function TestPage() {
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/staff/create`)
      .then((res) => res.json())
      .then((data) => console.log('Backend connected:', data))
      .catch((err) => console.error('Connection failed:', err));
  }, []);

  return <div>Check console for backend connection</div>;
}