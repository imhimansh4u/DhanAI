import { toast } from "sonner";

import { useState } from "react";

const useFetch = (cb)=>{                    // cb here is the function to be called inside usefetch (like useFetch(createAccount))
    const [data,setData] = useState(undefined);        
    const [loading , setLoading] = useState(null);
    const [error ,  setError] = useState(null);

    const fn = async (...args) => {          // we always call fn only , it then internally call createAccount or other
                                            // also ...args keeps all the arguments from createAccount into function 
        setLoading(true);    //  to show in the ui
        setError(null);      // set all previous errors to be null

        try {
            const response = await cb(...args);     // call the original function with all the arguments
            setData(response);                      // set the data
            setError(null);                         // set the error
        } catch (error) {
            setError(error);
            toast.error(error.message);
        }finally{
            setLoading(false);                       // in last task is done setLoading false
        }
    }

    return {data,loading,error, fn , setData};         // Return all the required 
}

export default useFetch;


// the return statement allows the components to use
// This allows the component to use:

// Value	:Purpose
// data	API :  response
// loading  :	show spinner
// error  :	show error
// fn   :	trigger API
// setData	:  manually update data


// NOTES :->
// We create useFetch to wrap an async function inside React state so that loading, data, and error can persist across renders 
// and update the UI correctly, which is impossible with a direct function call.



//                                  2.
// We use a custom hook instead of a direct function call because React needs state to manage async behavior and trigger re-renders  
// for loading, success, and error states.