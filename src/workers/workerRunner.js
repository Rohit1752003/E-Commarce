import worker from '.orderExpiration.worker.js';

const startWorker = () => {
   
    const run = async () => {
        try{
           
            await worker();
        }
        catch(err){
            console.error("Error in worker:", err);
        }  
        setTimeout(run, 60000);
    };
    run();
    
}
export default startWorker;