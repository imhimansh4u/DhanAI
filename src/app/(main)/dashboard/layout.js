import React, { Suspense } from 'react'
import Dashboardpage from './page'
import { BarLoader } from "react-spinners"


const Dashboardlayout = () => {
  return (
    <div className='ml-2'>

      {/* Dashboard page */}
      <Suspense fallback={<BarLoader />}>
        <Dashboardpage />
      </Suspense>
    </div>
  );
}

export default Dashboardlayout;

// This is layout for the Dashboard page (Like a wrapper)