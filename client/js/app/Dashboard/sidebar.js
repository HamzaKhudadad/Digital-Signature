import React, {useEffect, useState} from 'react';

import { Menu, Button, } from 'antd';
import {
  HomeOutlined,
  GlobalOutlined,
  SolutionOutlined,
  RadiusSettingOutlined,
  DiffOutlined
} from '@ant-design/icons';

import { useHistory }  from 'react-router';
import axios from 'axios';


const Sidebar = () => {
  const [Current, setCurrent] = useState("0");

//   const history = useHistory();



  const handleHomeClick = () => {
    // history.push('/main/home');
    return (<Redirect to={'/main/home'}/>)
  }

  const handleGlobalClick = () => {
    // history.push('/main/my-sign');
    return (<Redirect to={'/main/home'}/>)
  }

  const handleAddClick = () => {
    // history.push('/main/home');
    return (<Redirect to={'/main/home'}/>)
  }

  const handleResultClick = () => {

    // history.push('/main/sign-invite');
    return (<Redirect to={'/main/home'}/>)
  }


  const Login = () => {

    // history.push('/main/signin');
    return (<Redirect to={'/main/home'}/>)



  }

  const Logout = () => {
    axios.post("user/logout").then((resp)=>{
      localStorage.adminLoggedIn = false;
      localStorage.userLoggedIn = false;
      history.push('/signin');


    })
  }

  const handleClick = e => {
    console.log('click ', e);
    setCurrent(e.key);
  };



  return (
      <div>
        
        <Menu theme="light"  onClick={handleClick} mode="inline" selectedKeys={[Current]}>
          <Menu.Item key="0" onClick={handleAddClick} icon={<HomeOutlined />}>
            Home
          </Menu.Item>
          <Menu.Item key="1" onClick={handleGlobalClick} icon={<GlobalOutlined />}>
            My Sign
          </Menu.Item>
          <Menu.Item key="3" onClick={handleResultClick} icon={<RadiusSettingOutlined />}>
            Signee's
          </Menu.Item>
          </Menu>
        </div>
  );
}

export default Sidebar;
