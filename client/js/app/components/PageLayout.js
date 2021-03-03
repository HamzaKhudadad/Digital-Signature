import React , {useState} from 'react';

import {Layout, Menu, Divider, Row, Col, Typography, Dropdown,PageHeader,Button, Tag, Spin ,Space} from 'antd';
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  DownOutlined,
  LogoutOutlined,
  LoadingOutlined,
  EditTwoTone,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined
} from '@ant-design/icons';
import axios from 'axios';
import '../Dashboard/Dashboard.css'
import {useHistory} from 'react-router';
import {BrowserRouter as Router, Route, Switch, Redirect,} from "react-router-dom";

import Sidebar from '../Dashboard/sidebar';
// import Home from '../components/home/home.component';


const {Header, Sider, Footer, Content,} = Layout;
const {Title, Text, Paragraph} = Typography;
const antIcon = <LoadingOutlined style={{ fontSize: 18 }} spin />;

const Main = (props) => {

 console.log(props);

//   const history = useHistory();
  const [collapsed, setcollapsed] = useState(true);
  const [logoutloading, setLogoutLoading] = useState(false);


  const toggle = () => {
    setcollapsed(!collapsed)
  };

  const Update = () => {
      console.log('in update');
    // history.push('/main/settings')
    // history.go()
  }

  const Logout = () => {
    setLogoutLoading(true)
    axios.post("/user/logout").then((resp)=>{
        if(resp){setLogoutLoading(false)}
      localStorage.userLoggedIn = false;
      localStorage.userData = ''
    //   history.push('/main-signin')
    })
}

  const IconLink = ({ icon, text }) => (
    <a className="example-link">
      {icon}<text style={{marginLeft:'5px'}}>{text}</text>
    </a>
  );
  const content = (
      <div>
        <IconLink
          icon= {<MailOutlined />}
          text={"hamza@mail.com"}
        />
        <IconLink
          icon= {<PhoneOutlined />}
          text={'3456787654'}
        />
        <IconLink
          icon= {<HomeOutlined />}
          text={'dsfdsbvsdjvb dsswhasbd sdhgcv'}
        />
      </div>
  );
  const Content = ({ children, extraContent }) => {
    return (
      <Row>
        <div style={{ flex: 1 }}>{children}</div>
        <div className="image">{extraContent}</div>
      </Row>
    );
  };

  return (

      <Router>
        <Layout >
          <Sider trigger={null} collapsible collapsed={collapsed} theme="light">
            {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
              className: 'trigger',
              onClick: toggle,
            })}
            {/* {collapsed ? null : null} */}
            <Divider style={{margin: '0px 10px 10px 20px', width: '80%', minWidth: '50%'}}/>
            {collapsed ? null :
                <Title level={4} style={{fontSize: '12pt', fontWeight: '900', margin: '10px 10px 10px 20px'}}> </Title>}
            <Sidebar/>

          </Sider>
          <Layout className="site-layout" style={{minHeight: '100vh'}}>
            <Header className="site-layout-background" style={{padding: 0, background:'#f8a740'}}>
              <Row style={{height: '80px'}}>
                <Col span={16} style={{textAlign:'center', marginLeft:'150px'}}>
                  <text style={{color:'white', fontSize:'30pt', fontFamily:'Copperplate'}}>E-Sign</text>
                </Col>
              </Row>
            </Header>


             <PageHeader
             title={'John Doe'}
             subTitle={'Engineer at some ORG'}
             style={{ background:'white' }}
             tags={<Tag color="orange">Signed In</Tag>}
             extra={[
                
              <Button className='custom' onClick={Update}><EditTwoTone twoToneColor="#fead01"/>  Update Contact</Button>,
              <Button className='custom' onClick={Logout} disabled={logoutloading}> 
                  <LogoutOutlined style={{ color:'#fead01'}}/>
                Logout
              <Spin spinning={logoutloading} indicator={antIcon}/>
              </Button>,
            ]}
            avatar={{ src: 'https://avatars1.githubusercontent.com/u/8186664?s=460&v=4' }}
            >
                

          </PageHeader>
          

          {props.children}

          </Layout>
  
        </Layout>
      
      </Router>
  );


}

export default Main;



