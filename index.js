/**
 * Run the command to login: gcloud auth application-default login
 * 
 * In order to run this gcloud auth application-default login Visit: https://cloud.google.com/sdk/install 
 * 1) You have to install sdk into your computer 
 * 2) That will enable you to run the code 
 * 3) Log in to your associated gmail account then you are good to go!
 * 
 * Imp Ref : https://cloud.google.com/nodejs/docs/reference/documentai/latest
 */

 const projectId = 'YOUR_PROJECT_ID';
 const location = 'YOUR_PROJECT_LOCATION'; // Format is 'us' or 'eu'
 const processorId = 'YOUR_PROCESSOR_ID'; // Create processor in Cloud Console
 const filePath = '/path/to/local/pdf';
 
 const searchAssistIngestionUrl = '{searchAssistHostUrl}/searchassistapi/external/stream/{searchAssistStreamId}/ingest?contentSource=manual&extractionType=data&index=true'
 const JWT_Token = 'JWT_Token'
 
 const { DocumentProcessorServiceClient } = require('@google-cloud/documentai').v1;
 const request = require('request');
 
 // Instantiates a client
 // apiEndpoint regions available: eu-documentai.googleapis.com, us-documentai.googleapis.com (Required if using eu based processor)
 // const client = new DocumentProcessorServiceClient({apiEndpoint: 'eu-documentai.googleapis.com'});
 const client = new DocumentProcessorServiceClient();
 
 async function searchAssistDataIngestion(documents) {
     var options = {
         'method': 'POST',
         'url': searchAssistIngestionUrl,
         'headers': {
             'accept': 'application/json',
             'Content-Type': 'application/json',
             'auth': JWT_Token
         },
         body: JSON.stringify({
             "documents": documents,
             "name": "documentAi"
         })
 
     };
     request(options, function (error, response) {
         if (error) throw new Error(error);
         console.log(response.body);
     });
 }
 
 
 
 async function startDocumentAiExtraction() {
     // The full resource name of the processor, e.g.:
     // projects/project-id/locations/location/processor/processor-id
     // You must create new processors in the Cloud Console first
     const name = `projects/${projectId}/locations/${location}/processors/${processorId}`;
     // Read the file into memory.
     const fs = require('fs').promises;
     const imageFile = await fs.readFile(filePath);
 
     // Convert the image data to a Buffer and base64 encode it.
     const encodedImage = Buffer.from(imageFile).toString('base64');
 
     const request = {
         name,
         rawDocument: {
             content: encodedImage,
             mimeType: 'application/pdf',
         },
     };
     // Recognizes text entities in the PDF document
     const [result] = await client.processDocument(request);
     const { document } = result;
 
     // Create JSON for ingesting in searchAssist
     const documents = [];
     const { entities } = document;
     for (const entity of entities) {
         let snippet = {}
         for (const property of entity.properties) {
             if (property.type == 'paragraph') property.type = 'content'
             snippet[property.type] = property.mentionText
             documents.push(snippet)
         }
     }
     await searchAssistDataIngestion(documents);
     console.log("Script executed successfully");
 
 }
 
 startDocumentAiExtraction();