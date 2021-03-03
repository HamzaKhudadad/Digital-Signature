import React,{useEffect, useState} from 'react'
import { Row , List, Col, Typography, Divider, Tag, Table, Card, Spin } from 'antd'
import axios from 'axios';
import { EditOutlined, EllipsisOutlined, SettingOutlined } from '@ant-design/icons';
import { Upload, message } from 'antd';
import { LoadingOutlined, PlusOutlined, DropboxOutlined, GoogleOutlined} from '@ant-design/icons';
import DropboxChooser from 'react-dropbox-chooser';
import { Dropbox } from 'dropbox';

const apiKey='wsw5ns6bry2luw1';
const accessToken = '7afmm1wo3JIAAAAAAAAAAWfVmShp8A5g-ovJEos7yFSAVTXAdlnudVV_aH7m7bVH'

const dbx = new Dropbox({  
  clientId: apiKey,
  axios
});

let dropbox = '/assets/img/dropbox.png'
let gdrive = '/assets/img/gdrive.png'
const { Title, Text, Link } = Typography;
const { Meta } = Card;

const UploadDocument = (props) => {

    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [doc, setDoc] = useState()

    const getBase64 = (file) => {
        // this.setState({ file_name: file.name});
        localStorage.setItem('file_name', file.name);
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = error => reject(error);
          reader.readAsDataURL(file);
        });
      }

      const dropboxUpload = (files) => {
        //props.docUpload(files[0])
        console.log(files[0]);
        fetch(files[0].link, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/pdf',
    },
  })
  .then((response) => console.log(response))
        
       
      }

      const getFile = (file) => {
        console.log(Dropbox.getAccessToken());
      }
  
    const docUpload = (file) => {
        console.log(file);
        props.docUpload(file)
        // // const file = e.target.files[0];
        // getBase64(file).then(base64 => { 
        //   this.setState({doc:base64});
        //   localStorage.setItem('uploaded_doc', base64);
        //   this.setState({
        //     redirect: 'signature'
        //   });
        // });
        return false;
      }

    const uploadButton = (
        <div>
          {loading ? <LoadingOutlined /> : <PlusOutlined />}
          <div style={{ marginTop: 8 }}>Upload</div>
        </div>
      );

return(

    <div style={{margin:'30px 0px'}}>
           
           <Row justify='space-around'>
          <Col>
          <Text style={{fontSize:'18pt',fontWeight:'bold' }}>Upload</Text>
          </Col>
          {/* <Col>
          <Text style={{fontSize:'18pt',marginLeft:'10px'}}>Bs Computer Science</Text>
          </Col> */}
        </Row>
        <Divider />
        
        <Row justify='space-around'>
    
          <Col>
          <Upload
        name="avatar"
        listType="picture-card"
        className="avatar-uploader"
        showUploadList={false}
        beforeUpload ={(file)=>docUpload(file)}
       
      >
       {uploadButton}
      </Upload>
          </Col>
          <Col>
          <DropboxChooser appKey={apiKey}
          success={dropboxUpload}
          cancel={() => console.log('closed')}
          extensions={['.pdf']}
          linkType={'direct'}
          >
          <img src={dropbox} alt="avatar" style={{ width: '100px' }} /> 
          </DropboxChooser>
         </Col>

         <Col>
         <img src={gdrive} alt="avatar" style={{ width: '100px' }} /> 
         </Col>


        </Row>
        
    </div>

);

}
export default UploadDocument