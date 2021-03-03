import React,{useEffect, useState} from 'react'
import { Row , List, Col, Typography, Divider, Tag, Table, Card, Spin, Popover, Badge } from 'antd'
import axios from 'axios';
import { EditOutlined, EllipsisOutlined, SettingOutlined, CloseCircleOutlined } from '@ant-design/icons';
import swal from 'sweetalert';
var NavLink = require('react-router-dom').NavLink;
import { set } from 'mongoose';

const { Title,Text, Link } = Typography;
const { Meta } = Card;

const Documents = (props) => {

    const [currentPage, setCurrentPage] = useState(1);
    const [current_pages, setCurrent_pages] = useState(null);
    const [total_pages, setTotal_pages] = useState(0);
    const [invitation_list, setInvitation_list] = useState([]);
    const [pageLimit, setPageLimit] = useState(8);
    const [docs , setDocs]= useState([]);
    const [loaded, setLoaded] = useState(true);

    useEffect(() => {
        let mounted = true
        getDocs()
        return function cleanup() {
          mounted = false
      }
  
      },[]);

    const getDocs = (e, page) => {
        axios.post('/api/get_docs/', { token: localStorage.getItem('jwtToken'), page: page ? page : currentPage, pageLimit: pageLimit}).then((res) => {
            setDocs(res.data.docs)
            setCurrent_pages(res.data.page)
            setTotal_pages(res.data.total_pages)
            setLoaded(false)
          
          let ids = {};
          let docs = res.data.docs;
          Object.keys(docs).forEach(function (head) {
            Object.keys(docs[head].images).forEach(function (key) {
              ids[docs[head]._id] = [];
              Object.keys(docs[head].images[key].drag_data).forEach(function (key2) {
                if (!ids[docs[head]._id].includes(docs[head].images[key].drag_data[key2].signer_id)) {
                  ids[docs[head]._id].push(docs[head].images[key].drag_data[key2].signer_id);
                } 
              });
            });
          });
          getSignersWithDoc(ids);
        }).catch(error => {
          swal("Error!", error.response.data.error, "error");
        });
      }

      const getSignersWithDoc = (data) => {
        axios.post('/api/signerswithdoc/', { signDoc: data, token: localStorage.getItem('jwtToken') }).then((res) => {
          setInvitation_list(res.data.msg)
        }).catch(error => {
          swal("Error!", error.response.data.error, "error");
        });
      }

  
    console.log(docs);
      
return(

    <div style={{margin:'30px 0px'}}>
           <Spin spinning={loaded}>
           <Row justify='space-around'>
          <Col>
          <Text style={{fontSize:'18pt',fontWeight:'bold' }}>My Documents</Text>
          </Col>
          {/* <Col>
          <Text style={{fontSize:'18pt',marginLeft:'10px'}}>Bs Computer Science</Text>
          </Col> */}
        </Row>
        <Divider />
        <Row justify='space-around'>
            { docs.map(doc => {
                let img = "/files/docs/" + doc.images[0].name || "/assets/img/doc-1.png";
                return( <Col style={{marginBottom:'20px'}}>
                <Badge count={<CloseCircleOutlined />}  >
                <Card
                hoverable
                style={{ width: 240 }}
                cover={<Row justify={'center'} style={{marginTop:'10px'}}><img src={img} alt="No Thumb" style={{width:'150px'}} /></Row>}
                actions={[
                    <NavLink to={'signature/' + doc._id} className="btn-default btn-flat">SIGN</NavLink>,
                    <a href="javascript:void(0)" id={doc._id} data-string={JSON.stringify(doc.images.map(img=> img.drag_data))} onClick={props.appendId}>SEND FOR SIGNING </a>,
                    <Popover placement="rightBottom" content={<a href={'files/docs/' + doc.file} target="_blank"><i className="fa fa-download"></i></a>} trigger="click">
                    <EllipsisOutlined key="ellipsis" />
                    </Popover>
                ]}
                > 
                
                    <Meta description={doc.title} />
                </Card>
                </Badge>
          </Col> )
            }
            )}
          
        </Row>
        </Spin>
    </div>

);

}
export default Documents