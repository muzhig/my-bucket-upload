import Uppy from '@uppy/core'
import { Dashboard } from '@uppy/react'
import AwsS3 from '@uppy/aws-s3'
import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'
import React, {useState} from "react";

/*
* This is an experiment with AI-powered spreadsheet data ingestion.
* The goal is to allow users to upload a spreadsheet, and have the data automatically ingested into the database.
* Problem we're solving: Automatically mapping inconsistent data format to a pre-defined schema.
*
* Current state:
* 1. uploads work
* 2. correct presigned GET url is generated
* 3. TODO:
*   - read file header & maybe multiple random rows
*   - create an API to detect file type / columns / content description
*   - fill this meta data into the form
* */

interface StringArray {
    [index: number]: string;
}
const presignedGetUrlMap = [] as Array<{get_url: string, put_url: string}>
export default function FileUpload (props: any) {
  const [fileUrls, setFileUrls] = useState({} as StringArray)
  const uppy = React.useMemo(() => {
    const _uppy = new Uppy({
      // id: 'my-uppy',
      restrictions: {
        maxFileSize: 10000000, //10MB
        allowedFileTypes,
        maxNumberOfFiles: 1,
      },
      autoProceed: false,
      // debug: true,
    })
    .use(AwsS3, {
      getUploadParameters (file: any) {
        return fetch(
          'https://d6ng80po18.execute-api.us-east-1.amazonaws.com/dev/sign-upload-url',
          {
            method: 'post',
            headers: {
              'accept': 'application/json',
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              file_name: file.meta?.name || file.name,
              content_type: file.meta?.type || file.type,
              description: file.meta?.description,
              file_size: file.size,
            })
          })
          .then((response) => response.json())
          .then((data : {method: string, url: string, headers: any, get_url: string}) => {
            setFileUrls({...fileUrls, [data.url]: data.get_url})
            presignedGetUrlMap.push({
              put_url: data.url,
              get_url: data.get_url,
            })
            return {
              method: data.method,
              url: data.url,
              headers: data.headers,
            }
          })
      },
      getResponseData(this: any, responseText: any, xhr: any): {location: string | null} {
        if (!xhr.responseURL) {
          return { location: null }
        }
        const get_url = presignedGetUrlMap.find((item) => item.put_url === xhr.responseURL)?.get_url
        return { location: get_url || null }
      }
    } as any)
    _uppy.on('complete', (result) => {
      console.log('Upload complete! We’ve uploaded these files:', result)
      // throw new Error('Upload complete! We’ve uploaded these files: '+ result)
    })
    return _uppy
  }, [])

  return <Dashboard
    uppy={uppy}
    style={{display: 'flex', justifyContent: 'center', marginTop: '4rem'}}
    showLinkToFileUploadResult={true}
    proudlyDisplayPoweredByUppy={true}
    note={"Drop a sheet in any format - Excel, CSV, TSV"}
    metaFields={[
       {id: 'name', name: 'Name', placeholder: 'You can rename the file here'},
       {id: 'description', name: "Description", placeholder: "Briefly describe what the file contains"}
    ]}
    {...props}
  />
}


const allowedFileTypes = [
  'text/plain',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.oasis.opendocument.text',
  // tsv
  'text/tab-separated-values',
  'text/x-tab-separated-values',
  'text/tab-separated-text',
  'text/x-tab-separated-text',
  'text/tsv',
  'text/x-tsv',
  // json
  'application/json',
  'text/json',
  // json lines
  'application/x-ndjson',
  'application/x-jsonlines',
  'application/jsonlines',
  'application/json-lines',

]
