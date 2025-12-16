import React, { Suspense } from 'react'
import Dashboardpage from './page'
import { BarLoader } from "react-spinners"


const Dashboardlayout = () => {
  return (
    <div className='ml-2'>
      <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
        Dashboard
      </h1>

      {/* Dashboard page */}
      <Suspense fallback={<BarLoader />}>
        <Dashboardpage />
      </Suspense>
    </div>
  );
}

export default Dashboardlayout;

// This is layout for the Dashboard page