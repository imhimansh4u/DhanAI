import React from 'react'

const Mainlayout = ({ children }) => {
    return <div className='container mx-auto my-32'>{children}</div>
}

export default Mainlayout;



// So this wrapper provides a consistent design structure for all pages inside your "Main" folder —
// you don’t have to repeat the same container and spacing in every page.