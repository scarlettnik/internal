'use client';

import dynamic from 'next/dynamic';

const Card = dynamic(() => import('./Card'), {
  ssr: false,
});

const App = () => {
  return (
    <div>
      <Card />
    </div>
  );
};

export default App;