import React, {Component} from 'react';
import axios from 'src/common/myAxios';
import DropArea from './DropArea';
import  { Redirect } from 'react-router-dom'
import { Modal , Form, Input, Select, Tooltip, Button, InputNumber, Row, Col , Typography} from 'antd';
import Sign from './Sign';
import './Signature.css';
var html2canvas = require('html2canvas');
import jsPDF from 'jspdf';
import swal from 'sweetalert';
var NavLink = require('react-router-dom').NavLink;
import SignerFields from './SignerFields';
import { CheckCircleTwoTone, RetweetOutlined, CloseCircleTwoTone} from '@ant-design/icons';
// import { Powerpoint, Word } from 'pdf-officegen'
// const p = new Powerpoint([{}]);
// p.convertFromPdf('/var/www/html/Digital-Signature/server/uploads/docs/sample.pdf', [{}], (err, result) => {
//   console.log(result);
// })
// localStorage.clear();
class Signature_edit extends Component {
  constructor(props){
    super(props);
    let edit_id = null;
    const params = this.props.location.pathname.split('/');
    if(params[params.length-1] != 'signature'){
      edit_id = params[params.length-1];
    }
    // debugger;
    this.state = {
      page:'signature',
      inputFields:[],
      doc:null,
      edit_id:edit_id,
      doc_blob:null,
      pdf_doc:null,
      top:383,
      left:479,
      doc_id:null,
      HTML_Width:null,
      HTML_Height:null,
      top_left_margin:null,
      canvas_image_width:null,
      canvas_image_height:null,
      page_section:null,
      uploaded_sign:null,
      sign_image:null,
      sign_font:null,
      sign_text:null,
      bind_signature:false,
      signer_field:null,
      sign_texts:{},
      docs:[],
      color:'black',
      buttons:{
        sign:false,
        clear:false,
        revoke:false
      },
      doc_for_sign: this.props.location.query.sign ? this.props.location.query.sign : false,
      signer:null,
      signer_clr:null,
      exist_signer:null,
      signers_err:null,
      active_tab:'initial',
      signers:[],
      first_attempt:false,
      onStartCount:0,
      token:localStorage.getItem('jwtToken'),
      signer_ids:[],
      allOk:true,
      redirect:false,
      currentDocId:null,
      signer_fillable_fields:{},
      onetimeload:false,
      showSigner:false,
      checked:true,
      field_required:'required',
      isModalVisible: false,
      showVerifyOtp: true,
      verified: false,
      notVerified: false

    };
    let doc = localStorage.getItem('uploaded_doc') || ''
    if(doc){
      this.chkFileType(doc);
    }
    this.addField = this.addField.bind(this);
    this.handleChange = this.handleChange.bind(this);
    // console.log(this.state);debugger;
  }

  getBase64 = (file) => {
    console.log(file);
    // this.setState({ file_name: file.name});
    localStorage.setItem('file_name', file.name);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  }

  oneTimeLoad = (done) => {
    if (done) {
      this.setState({ onetimeload: true }); 
    }
  }

  refreshSigners(doc_id){
    this.setState({signer: null});
    this.setState({ currentDocId: doc_id });
    // this.setState({exist_signer: null});
    axios.post('/api/signers/',{token:this.state.token}).then((res) => {
      this.setState({
        signers: res.data
      });
     
    }).catch(error => {
      console.log(error.response);
    });
  }

  getRandomColor = () => {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  getSigners  = (ids) => {
    axios.post('/api/signers/',{ids:ids,token:localStorage.getItem('jwtToken')}).then((res) => {
      this.setState({
        signers: res.data
      });
     
    }).catch(error => {
      console.log(error.response);
    });
  }

  componentDidMount() {
    let objThis = this;
    let docs = localStorage.getItem('files_array') || this.state.docs
    try {
      docs = JSON.parse(docs)
    }catch(e){

    }
    console.log(docs);
    let fillabel = {};
    if (this.state.edit_id) {
      axios.get('/api/doc/'+this.state.edit_id).then((res) => {
        this.setState({
          docs: res.data.images
        });
        let ids = [];
        Object.keys(res.data.images).forEach(function(key){ 
          Object.keys(res.data.images[key].drag_data).forEach(function(key2){
            // if(res.data.images[key].drag_data[key2].type == "signer_added"){
              ids.push(res.data.images[key].drag_data[key2].signer_id);
              if (res.data.images[key].drag_data[key2].signer_id == objThis.state.doc_for_sign) {
                res.data.images[key].drag_data[key2]['sign'] = false;
                fillabel[res.data.images[key].drag_data[key2].id] = res.data.images[key].drag_data[key2];//{ id: res.data.images[key].drag_data[key2].id, signer_id: res.data.images[key].drag_data[key2].signer_id, doc_id: res.data.images[key].drag_data[key2].doc_id ,type: res.data.images[key].drag_data[key2].type, content: res.data.images[key].drag_data[key2].content, sign: false }
              }
            // }
          });
        });
        this.setState({
          signer_ids: [...new Set(ids)]
        });
        if(localStorage.getItem('jwtToken')){
          this.getSigners([...new Set(ids)]);
        }
      }).catch(error => {
        console.log(error.response);
      });
    }else{
      this.setState({
        docs: docs
      });
    }
    this.setState({ allOk: false });
    this.setState({
      signer_fillable_fields: fillabel
    });
  }

  closeAttempt(){
    this.setState({first_attempt: false});
  }

  addField(e){
    let fld = this.state.signer_field; console.log(this.state.exist_signer);
    if(this.state.signer){
      let clr = this.getRandomColor();
      // this.setState({signer_clr: clr});
      axios.post('/api/addfield',{signer:this.state.signer,signer_clr:clr,docId:this.state.edit_id,token:this.state.token}).then((res) => {
        this.state.inputFields.push('signer_added');
        this.setState({
          signer_clr: clr, signer_field: fld, first_attempt: true, signer_id: res.data._id
        }, () => {
          $('.signer_added.' + res.data._id).css('background-color', res.data.color);
          $('#add_signer').modal('hide');
          let docid = this.state.currentDocId;
          $("#signature_container_" + docid).click();
        });
     
      }).catch(error => {
        
      });
    }else if(this.state.exist_signer){
      this.state.inputFields.push('signer_added');
      this.setState({first_attempt: true});
      // let unique = [...new Set(this.state.inputFields)];
      // this.setState({inputFields:unique});
      let sgn = this.state.exist_signer;
      this.setState({signer_field: fld});
      axios.get('/api/signer/'+this.state.signer_id).then((res) => {  
        if(res.data.color){
          // this.setState({signer_clr: res.data.color});
          this.setState({
            signer_clr: res.data.color
          }, () => {
            $('.signer_added.' + res.data._id).css('background-color', res.data.color);
            this.state.field_count += 1;
            $('#add_signer').modal('hide');
              let docid = this.state.currentDocId;
            $("#signature_container_" + docid).click();
          })
        }
      }).catch(error => {
        console.log(error.response);
      });
      
    }else{
      this.setState({signers_err: 'Signer is Required'});
      // debugger;
    }
  }

  chkFileType = (doc) => {
    var loader = document.getElementById('outer-barG');
    $('<div class="modal-backdrop show" id="modal_backdrop"></div>').appendTo('body');
    $(loader).css('display','block');
    axios.post('/api/chktype',{doc_file:doc, file_name: localStorage.getItem('file_name')}).then((res) => {
      localStorage.setItem('uploaded_doc', '');
      localStorage.setItem("files_array", JSON.stringify(res.data))
      this.setState({
        docs: res.data
      });
      $('#modal_backdrop').remove();
      $('#outer-barG').hide();
    }); 
  }

  convertHtmlToCanvas = (e) => {
    e.preventDefault();

      this.finalSave(e);


    // let edit_id = this.state.edit_id;
    // let docs = this.state.docs;
    // let inputfields = this.state.inputFields;
    // let sign_id = this.state.doc_for_sign;
    // const objThis = this;
    // if(this.state.docs.length > 0){
    //   for(let i=1;i <=this.state.docs.length;i++){
    //     let drag_data = [];
    //     docs[parseInt(i) - 1].drag_data = [];
    //     $("#signature_container_" + i + " .unselectable").each(function (index) {
    //       let key___ = inputfields.slice(inputfields.length - 1);
    //       let field = $(this).data('id') || key___[0];
    //       let type = $(this).data('id') || field;
    //       let img = $(this).find('img').attr('src');
    //       let w = $(this).width();
    //       let h = $(this).height();
    //       let font = $(this).css("font-size");
    //       let fontfamily = $(this).find('span').css('font-family');
    //       let clr = $(this).find('span').css('color');
    //       let signer_id = $(this).attr('data-signerid') ? $(this).attr('data-signerid') : sign_id;
    //       let bgcolor = $(this).attr('data-color');
    //       let reqrd = false;
    //       let signed = false;
    //       let content = $(this).find('span').text();
    //       if (type == 'text') {
    //         content = $(this).find('input[type="text"]').val();
    //       }
    //       let attached = null;
    //       if (type == 'attach') {
    //         attached = $(this).find('span').attr('data-src');
    //       }
    //       if ($(this).find('span').hasClass('required')) {
    //         reqrd = 'required';
    //       }
    //       let sign_done = false;
    //       if ($(this).hasClass('signed_done')) {
    //         sign_done = true
    //         signed = $(this).attr('data-signerid');
    //       }
    //       drag_data.push({ id: index, isDragging: false, isResizing: false, top: $(this).css('top'), left: $(this).css('left'), width: w, height: h, fontSize: font, isHide: false, type: type, appendOn: false, content: content, doc_id: i, required: reqrd, sign_img: img, sign_text: $(this).find('span').text(), sign_font: fontfamily, sign_color: clr, signer_id: signer_id, signer_clr: bgcolor, signed_done_by: signed, attach_img: attached, completed:sign_done });
    //     });
    //     // console.log(drag_data);
    //     // debugger;
    //     docs[parseInt(i) - 1].drag_data = drag_data;
    //     swal({
    //       title: "Do You Want to save it in your account?",
    //       icon: "success",
    //       buttons: ["No", "Yes"],
    //       dangerMode: false,
    //     })
    //     .then(willSave => {
    //         if (willSave) {
    //           var reader = new FileReader();
    //           reader.readAsDataURL(blob);
    //           reader.onloadend = function () {
    //             let base64data = reader.result;
    //           axios.post('/api/add_doc', { base64Data: base64data, token: localStorage.getItem('jwtToken'), docs: docs, file_name: localStorage.getItem('file_name'), tempId: objThis.state.template_id }).then((res) => {
    //             localStorage.removeItem('file_name');
    //             $('#outer-barG').hide();
    //             objThis.setState({ redirect: 'dashboard' });
    //           });
    //           swal("Saved!", "Your doc file has been saved", "success");
    //         }
    //         }else{
    //           $('#outer-barG').hide();
    //         }
    //     });
    //   }
    // }
  }

  finalSave = (e) => {
    e.preventDefault();
    let doc = '';
    let width = '';
    let height = '';
    let edit_id = this.state.edit_id;
    let docs = this.state.docs;
    let inputfields = this.state.inputFields;
    let sign_id = this.state.doc_for_sign;
    const objThis = this;
    if (this.state.docs.length > 0) {
      for (let i = 1; i <= this.state.docs.length; i++) {
        $("#signature_container_" + i ).css('background-color', 'transparent');
        html2canvas(document.querySelector("#signature_container_" + i), { allowTaint: true }).then(canvas => {
          var imgData = canvas.toDataURL(
            'image/jpeg', [0.0, 1.0]);
          this.calculatePDF_height_width("#signature_container_" + i, 0);
          if (i == 1) {
            doc = new jsPDF('p', 'mm', 'a4');
            width = doc.internal.pageSize.getWidth();
            height = doc.internal.pageSize.getHeight();
            doc.setFont("helvetica");
            doc.setFontType("bold");
          } else {
            doc.addPage('a4','p');
          }
          let drag_data = [];
          docs[parseInt(i) - 1].drag_data = [];
                $("#signature_container_" + i + " .unselectable").each(function (index) {
          let key___ = inputfields.slice(inputfields.length - 1);
          let field = $(this).data('id') || key___[0];
          let type = $(this).data('id') || field;
          let img = $(this).find('img').attr('src');
          let w = $(this).width();
          let h = $(this).height();
          let font = $(this).css("font-size");
          let fontfamily = $(this).find('span').css('font-family');
          let clr = $(this).find('span').css('color');
          let signer_id = $(this).attr('data-signerid') ? $(this).attr('data-signerid') : sign_id;
          let bgcolor = $(this).attr('data-color');
          let reqrd = false;
          let signed = false;
          let content = $(this).find('span').text();
          if (type == 'text') {
            content = $(this).find('input[type="text"]').val();
          }
          let attached = null;
          if (type == 'attach') {
            attached = $(this).find('span').attr('data-src');
          }
          if ($(this).find('span').hasClass('required')) {
            reqrd = 'required';
          }
          let sign_done = false;
          if ($(this).hasClass('signed_done')) {
            sign_done = true
            signed = $(this).attr('data-signerid');
          }
          drag_data.push({ id: index, isDragging: false, isResizing: false, top: parseFloat($(this).css('top')), left: parseFloat($(this).css('left')), width: parseFloat(w), height: parseFloat(h), fontSize: font, isHide: false, type: type, appendOn: false, content: content, doc_id: i, required: reqrd, sign_img: img, sign_text: $(this).find('span').text(), sign_font: fontfamily, sign_color: clr, signer_id: signer_id, signer_clr: bgcolor, signed_done_by: signed, attach_img: attached, completed: sign_done });
        });
          $("#signature_container_" + i + ".selected").each(function (index) {
            let key___ = inputfields.slice(inputfields.length - 1);
            let field = $(this).data('id') || key___[0];
            let type = $(this).data('id') || field;
            let img = $(this).find('img').attr('src');
            let w = $(this).width();
            let h = $(this).height();
            let font = $(this).css("font-size");
            let fontfamily = $(this).find('span').css('font-family');
            let clr = $(this).find('span').css('color');
            let signer_id = sign_id ? sign_id : $(this).find('span').attr('id');
            let bgcolor = $(this).attr('data-color');
            let reqrd = false;
            let signed = false;
            if (sign_id) {
              signed = sign_id;
            }
            let content = $(this).find('span').text();
            if (type == 'text') {
              content = $(this).find('input[type="text"]').val();
            }
            let attached = null;
            if (type == 'attach') {
              attached = $(this).find('span').attr('data-src');
            }
            if ($(this).find('span').hasClass('required')) {
              reqrd = true;
            }
            drag_data.push({ id: index, isDragging: false, isResizing: false, top: parseFloat($(this).css('top')), left: parseFloat($(this).css('left')), width: parseFloat(w), height: parseFloat(h), fontSize: font, isHide: false, type: type, appendOn: false, content: content, doc_id: i, required: reqrd, sign_img: img, sign_text: $(this).find('span').text(), sign_font: fontfamily, sign_color: clr, signer_id: signer_id, signer_clr: bgcolor, signed_done_by: signed, attach_img: attached });
          });
          docs[parseInt(i) - 1].drag_data = drag_data;
          doc.addImage(imgData, 'JPEG', 0, 0, width, height);
          if (i == this.state.docs.length) {
            setTimeout(function () {
              var blob = doc.output("blob");
              var blobURL = URL.createObjectURL(blob);
              var downloadLink = document.getElementById('pdf-download-link');
              downloadLink.href = blobURL;
              var loader = document.getElementById('outer-barG');
              $('#modal_backdrop').remove();
              $(loader).css('display', 'none');
              swal({
                title: "Do You Want to save it in your account?",
                icon: "success",
                buttons: ["No", "Yes"],
                dangerMode: false,
              })
                .then(willSave => {
                  if (willSave) {
                    var reader = new FileReader();
                    reader.readAsDataURL(blob);
                    reader.onloadend = function () {
                      let base64data = reader.result;
                      console.log("dragdata for " + i + " --> " +  docs);
                      axios.put('/api/doc/' + edit_id, { base64Data: base64data, token: localStorage.getItem('jwtToken'), docs: docs, file_name: localStorage.getItem('file_name'), tempId: objThis.state.template_id }).then((res) => {
                        localStorage.removeItem('file_name');
                        $('#outer-barG').hide();
                        objThis.setState({ redirect: 'dashboard' });
                      }).catch(err=>swal(err || "Something went wrong"));
                      swal("Saved!", "Your doc file has been saved", "success");
                    }
                  }
                  else{
                    $('#outer-barG').hide();
                  }
                });
            }, 500);
          }
        });
      }
    }
  }

 

  calculatePDF_height_width = (selector,index) => {
    this.state.page_section = $(selector).eq(index);
    this.state.HTML_Width = this.state.page_section.width();
    this.state.HTML_Height = this.state.page_section.height();
    this.state.top_left_margin = 10;
    this.state.PDF_Width = this.state.HTML_Width + (this.state.top_left_margin * 2);
    this.state.PDF_Height = (this.state.PDF_Width * 1.2) + (this.state.top_left_margin * 2);
    this.state.canvas_image_width = this.state.HTML_Width;
    this.state.canvas_image_height = this.state.HTML_Height;
  }

  docUpload = (e) => {
    const file = e.target.files[0];
    this.getBase64(file).then(base64 => {
      this.setState({
        uploaded_sign: base64
      });
      this.chkFileType(base64);
    });
  }

  removeSignature(e){
    e.preventDefault();
    this.signaturePad.clear();
  }

  saveData(e){
    e.preventDefault();
    $('<div class="modal-backdrop show" id="modal_backdrop"></div>').appendTo('body');
    // document.getElementById("app").appendChild('<div class="modal-backdrop show"></div>');
    $('#outer-barG').show();
    this.convertHtmlToCanvas(e);
    $('#modal_backdrop').remove();
    // setTimeout(() => {
    //   console.log(this.state.redirect);
    //   if (this.state.redirect) {
    //     return (<Redirect to={'/' + this.state.redirect} />);
    //   }
    // }, 1000);
  }

  createTextField(e){
    e.preventDefault();
    $(e.target).addClass('current-btn');
    $('#date_field').removeClass('current-btn');
    $('#initial_field').removeClass('current-btn');
    $('#sign_pad').removeClass('current-btn');
    $('#check_field').removeClass('current-btn');
    $('#clear_field').removeClass('current-btn');
    

    $('.signature_container').addClass('hovrcr_text');
  	$('.signature_container').removeClass('hovrcr_date');
  	$('.signature_container').removeClass('hovrcr_initials');
    $('.signature_container').removeClass('hovrcr_check');
    $('.signature_container').removeClass('hovrcr_sign');
    this.state.inputFields.push('text');
    // this.setState({inputFields:textfield});
    console.log('clicked on text button')
  }

  createDateField(e){
    e.preventDefault();
    $(e.target).addClass('current-btn');
    $('#text_field').removeClass('current-btn');
    $('#initial_field').removeClass('current-btn');
    $('#sign_pad').removeClass('current-btn');
    $('#check_field').removeClass('current-btn');
    $('#clear_field').removeClass('current-btn');

    $('.signature_container').addClass('hovrcr_date');
    $('.signature_container').removeClass('hovrcr_text');
    $('.signature_container').removeClass('hovrcr_initials');
    $('.signature_container').removeClass('hovrcr_check');
    $('.signature_container').removeClass('hovrcr_sign');
    this.state.inputFields.push('date');
    // this.setState({inputFields:datefield});
    let unique = [...new Set(this.state.inputFields)];
    this.setState({inputFields:unique});
    console.log('clicked on Date button')
  }

  showInitialField(e){
    e.preventDefault();
    this.state.inputFields.push('initials');
    $(e.target).addClass('current-btn');
    $('#text_field').removeClass('current-btn');
    $('#sign_pad').removeClass('current-btn');
    $('#check_field').removeClass('current-btn');
    $('#clear_field').removeClass('current-btn');
    $('#date_field').removeClass('current-btn');

    $('#text_field').removeClass('current-btn');
    $('.sign-btn').click();
    $('#sign_nav_tabs .nav-item #type_').addClass('active');
    $('#sign_nav_tabs .nav-item #draw_').removeClass('active');
    $('#sign_nav_tabs .nav-item #upload_').removeClass('active');

    $('.modal-content .modal-body #type').addClass('active');
    $('.modal-content .modal-body #draw').removeClass('active').removeClass('show');
    $('.modal-content .modal-body #upload').removeClass('active').removeClass('show');

    $('.signature_container').addClass('hovrcr_initials');
    $('.signature_container').removeClass('hovrcr_text');
    $('.signature_container').removeClass('hovrcr_date');
    $('.signature_container').removeClass('hovrcr_check');
    $('.signature_container').removeClass('hovrcr_sign');
    this.setState({active_tab:'initial'});
    console.log('clicked on Initial Button')
  }

  showSignatureField(e){
    e.preventDefault();
    $(e.target).addClass('current-btn');
    $('#text_field').removeClass('current-btn');
    $('#initial_field').removeClass('current-btn');
    $('#check_field').removeClass('current-btn');
    $('#clear_field').removeClass('current-btn');
    $('#date_field').removeClass('current-btn');

    $('#text_field').removeClass('current-btn');
    // $('.sign-btn').click();
    $('#sign_nav_tabs .nav-item #draw_').addClass('active');
    $('#sign_nav_tabs .nav-item #type_').removeClass('active');
    $('#sign_nav_tabs .nav-item #upload_').removeClass('active');

    $('.modal-content .modal-body #draw').addClass('active').addClass('show');
    // $('.signature-container div div').addClass('sign_pad_tab');
    
    $('.modal-content .modal-body #type').removeClass('active');
    $('.modal-content .modal-body #upload').removeClass('active').removeClass('show');

    $('.signature_container').addClass('hovrcr_sign');
    $('.signature_container').removeClass('hovrcr_text');
    $('.signature_container').removeClass('hovrcr_date');
    $('.signature_container').removeClass('hovrcr_check');
    $('.signature_container').removeClass('hovrcr_initials');
    var canvas = document.getElementById("sign_pad_tab");
    var context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.restore();
    this.setState({active_tab:'signpad'});
    console.log('clicked on Signature Button')
  } 

  showCheckField = (e) => {
    e.preventDefault();
    $(e.target).addClass('current-btn');
    $('#text_field').removeClass('current-btn');
    $('#initial_field').removeClass('current-btn');
    $('#sign_pad').removeClass('current-btn');
    $('#clear_field').removeClass('current-btn');
    $('#date_field').removeClass('current-btn');

    $('.signature_container').addClass('hovrcr_check');
    $('.signature_container').removeClass('hovrcr_text');
    $('.signature_container').removeClass('hovrcr_date');
    $('.signature_container').removeClass('hovrcr_sign');
    $('.signature_container').removeClass('hovrcr_initials');
    this.state.inputFields.push('check');
  }

  clearContainer = (e) => {
    $(e.target).addClass('current-btn');
    $('.signature_container').removeClass('hovrcr_check').removeClass('hovrcr_text').removeClass('hovrcr_date').removeClass('hovrcr_sign').removeClass('hovrcr_initials');
    $('#text_field').removeClass('current-btn');
    $('#initial_field').removeClass('current-btn');
    $('#sign_pad').removeClass('current-btn');
    $('#check_field').removeClass('current-btn');
    $('#date_field').removeClass('current-btn');
    let unique = [...new Set([])];
    this.setState({inputFields:unique});
    this.setState({sign_image:null});
    this.setState({bind_signature: false});
    this.setState({sign_text: null});
    this.setState({sign_texts: {}});
    $('.signature_container').html('');
  }

  getSignPosition(top,left,doc_id){
    this.setState({ top: parseFloat(top)});
    this.setState({ left: parseFloat(left)});
    this.setState({doc_id:doc_id});
  }

  updateSignField(sign){
    this.setState({sign_image:sign});
    this.setState({bind_signature: false});
  }

  updateSignFieldType(){
    this.state.inputFields.push('sign');
  }

  saveColor = (e) => {
    this.setState({[e.target.name]: e.target.value});
  }

  setSignFont = (font,e) => {
    this.setState({sign_font: font});
  }

  appendSignFont = (e) => {
    this.setState({sign_text: e.target.value});
    $('li.card').text(e.target.value);
    $('li.card').css('color',this.state.color);
  }



  setSignerField = (field) => {
    this.setState({signer_field: field});
    // this.state.signer_field.push(field);
    this.state.inputFields.push('signer');
  }

  appendSignature = (e) => {
    let docid = this.state.doc_id;
    console.log(docid);
    console.log(this.state.inputFields);
    console.log(this.state.active_tab);
    if(this.state.inputFields.includes('sign') && this.state.active_tab == 'signpad'){
      if (this.state.doc_for_sign) {
        this.setState({ first_attempt: true });
      }
      this.setState({bind_signature: true});
    }else{ 
      if(this.state.sign_text && this.state.active_tab == 'initial'){
        // this.state.sign_texts.push({text:this.state.sign_text,font:this.state.sign_font,color:this.state.color});
        this.setState({sign_texts: {text:this.state.sign_text,font:this.state.sign_font,color:this.state.color}});
        this.state.inputFields.push('sign_text');
      }
    }
    $('#close_btn').click();
    this.setState({active_tab:'initial'});
    if(this.state.doc_for_sign){  
      setTimeout(() => {  
        $("#signature_container_" + docid).click();
      }, 1000);
    }
  }

  resetTabs = (e) => {
    if(e.target.innerText == 'DRAW'){
      this.setState({active_tab:'signpad'});
    }
    if(e.target.innerText == 'TYPE'){
      this.setState({active_tab:'initial'});
    }
  }

  updateTab(tab){
    this.setState({active_tab:tab});
  }

  handleChange(e) {
    if(e.target.name == 'signer'){
      if(e.target.value){
        $('select[name="exist_signer"]').prop('disabled', true);
      }else{
        $('select[name="exist_signer"]').prop('disabled', false);
      }
    }
    if(e.target.name == 'exist_signer'){
      if(e.target.value){
        this.setState({signer_id: $(e.target).children(":selected").attr("id")});
        $('input[name="signer"]').attr('readonly','readonly');
      }else{
        $('input[name="signer"]').removeAttr('readonly');
      }
    }
    if(e.target.name == 'field_required'){
      this.setState(prevState => ({
        checked: !prevState.checked
      }));
      if ($(e.target).is(":checked")) {
        console.log(e.target.value)
        this.setState({[e.target.name]: e.target.value});
      }else{
        this.setState({[e.target.name]: ''});
      }
    }else{
      this.setState({[e.target.name]: e.target.value});
    }
  }

  handleVerify = (values) => {
    console.log('code', values);
    axios.get(`/api/verifycode?phonenumber=+923359399030&code=${values.code}`).then((res) => {
      console.log(res);
      if(res.data.status === 'approved'){
       this.setState({verified: true});
      }
      else{
        this.setState({notVerified: true});
      }
    })
  }

  handleGetCode = (values) => {
   console.log('mobile number', values);
   axios.get(`/api/getcode?phonenumber=${values.mobile}&channel=sms`).then((res) => {
     if(res.data.status && res.data.sendCodeAttempts.length){
      this.setState({showVerifyOtp: true});
     }
   })
  };

 handleCancel = () => {
  this.setState({isModalVisible: false});
  };

  showOtpPanel = (e) => {
    this.setState({isModalVisible: true});
  }

  enterData = (e) => {
    e.preventDefault();
    e.target.text = 'Next';
    let all_ok = false;
    let tag = '';
    let count = this.state.onStartCount;
    let objThis = this;
    let fillable = objThis.state.signer_fillable_fields;
    var size = 0, key;
    $(".signature_container .unselectable").each(function (index) {
      $(this).css('border','none');
    });
    console.log(fillable)
    let stopLoop = false;
    for (key in fillable) {
      if (size == count) {
        if (fillable[key].type == 'signer_added') {
          if (fillable[key].content == '✔') {
            if ($('#checkbox_doc_' + fillable[key].doc_id + '_' + fillable[key].id).hasClass('required') && $('#checkbox_doc_' + fillable[key].doc_id + '_' + fillable[key].id).prop("checked") == false) {
              stopLoop = true;
              $('#checkbox_doc_' + fillable[key].doc_id + '_' + fillable[key].id).css('border', '1px solid red');
            } else {
              $('#checkbox_doc_' + fillable[key].doc_id + '_' + fillable[key].id).css('border', '1px solid rgb(144, 183, 185)');
            }
          }
          else if (fillable[key].content == 'text') {
            if ($('#' + fillable[key].content + '_doc_' + fillable[key].doc_id + '_' + fillable[key].id).hasClass('required') && $('#' + fillable[key].content + '_doc_' + fillable[key].doc_id + '_' + fillable[key].id).find('input').val() == '') {
              stopLoop = true;
              $('#' + fillable[key].content + '_doc_' + fillable[key].doc_id + '_' + fillable[key].id).find('input').focus();
              $('#' + fillable[key].content + '_doc_' + fillable[key].doc_id + '_' + fillable[key].id).css('border', '1px solid red');
            } else {
              $('#' + fillable[key].content + '_doc_' + fillable[key].doc_id + '_' + fillable[key].id).css('border', '1px solid rgb(144, 183, 185)');
            }
          }
          else if (fillable[key].sign_img && fillable[key].sign_img.includes('radio_inactive.png')) {
            console.log($('#radio_doc_' + fillable[key].doc_id + '_' + fillable[key].id).find('input').val())
            if ($('#radio_doc_' + fillable[key].doc_id + '_' + fillable[key].id).hasClass('required') && !$('#radio_doc_' + fillable[key].doc_id + '_' + fillable[key].id).find('input').is(':checked')) {
              stopLoop = true;
              $('#radio_doc_' + fillable[key].doc_id + '_' + fillable[key].id).css('border', '1px solid red');
            } else {
              $('#radio_doc_' + fillable[key].doc_id + '_' + fillable[key].id).css('border', '1px solid rgb(144, 183, 185)');
            }
            
          } else {
            if ($('#' + fillable[key].type + '_doc_' + fillable[key].doc_id + '_' + fillable[key].id).hasClass('required')) {
              stopLoop = true;
              $('#' + fillable[key].type + '_doc_' + fillable[key].doc_id + '_' + fillable[key].id).css('border', '1px solid red');
            }else{
              $('#' + fillable[key].type + '_doc_' + fillable[key].doc_id + '_' + fillable[key].id).css('border', '1px solid rgb(144, 183, 185)');
            }
          }
        }
        console.log(stopLoop)
        console.log(size)
        console.log(count)
        console.log(Object.values(fillable).length)
        console.log(size + 1);
        if (Object.values(fillable).length == size + 1 && !stopLoop) {
          all_ok = true;
        }
      }
      size++;
      
      
    }
    // $(".signature_container").each(function( index ) {
    //   let docid = $(this).children().attr('data-docId'); 
    //   let field = $(this).children().attr('id'); 
      
    //   // tag = $(this).children().first().get(0).tagName; console.log($(tag.toLowerCase() + '#' + count));
    //   // $(tag.toLowerCase()+'#'+count).focus();
    // });
    // if (this.state.docs.length > 0) {
    //   let id = '';
    //   for (let i = 1; i <= this.state.docs.length; i++) {
    //     if ($("#signature_container_" + i).children().hasClass('text')) {
    //       if ($("#signature_container_" + i).children().find('input[type="text"]#' + this.state.doc_for_sign).first().val()) {
    //         all_ok = true;
    //       }else{
    //         all_ok = false;
    //       }
    //     }
    //     console.log(all_ok)
    //     if ($("#signature_container_" + i).children().hasClass('sign_text') || $("#signature_container_" + i).children().hasClass('signer_added')) {
    //       let elem = $("#signature_container_" + i).children().find('span#' + this.state.doc_for_sign);
    //       // console.log(elem);
    //       if (elem.first().text() != '' && elem.first().text() == 'sign_text' && all_ok) {
    //         console.log(elem.first().text())
    //         all_ok = true;
    //       } else {
    //         all_ok = false;
    //       }
    //     }
    //     console.log(all_ok)
    //     if ($("#signature_container_" + i).children().hasClass('sign') || $("#signature_container_" + i).children().hasClass('signer_added')) {
    //       id = $("#signature_container_" + i).children().find('span').attr('id');
    //       if ($("#signature_container_" + i).children().find('img#' + this.state.doc_for_sign).length > 0 && $("#signature_container_" + i).children().find('span#' + this.state.doc_for_sign).first().text() != 'sign' && all_ok) {
    //         all_ok = true;
    //       } else {
    //         all_ok = false;
    //       }
    //     }
    //     console.log(all_ok)
    //     if ($("#signature_container_" + i).children().hasClass('checkbox')) {
    //       id = $("#signature_container_" + i).children().find('span').attr('id');
    //       if ($("#signature_container_" + i).children().find('input[type="checkbox"]:checked').length > 0 && all_ok) {
    //         all_ok = true;
    //       } else {
    //         all_ok = false;
    //       }
    //     }
    //     console.log(all_ok)
    //   }
    // }
    if (!stopLoop) {
      this.state.onStartCount += 1;
    }
    
    this.setState({ allOk: all_ok });
  }

  checkAllOk = (drag_id) => {
    let allok = true;
    let listt = this.state.signer_fillable_fields;
    if (listt[drag_id]) {
      listt[drag_id].sign = true;
      this.setState({ signer_fillable_fields: listt });
    }

    Object.keys(listt).map((chk) => {
      console.log(listt[chk]);
      // if (!listt[chk].sign) {
      //   allok = false;
      // }
      if (listt[chk].required == 'required' && !listt[chk].sign) {
        allok = false;
      }
    });
    this.setState({ allOk: allok });
  }

  showHideAddSigner = () => {
    this.setState(prevState => ({
      showSigner: !prevState.showSigner
    }));
  }

  render() {
    console.log("dfvf 854 "+ this.state.doc_for_sign);
    console.log("all ok 855 "+ this.state.allOk);
    let dashboard = '';
    let docs = localStorage.getItem('files_array')  || this.state.docs 
    try {
      docs = JSON.parse(docs)
    }catch(e){

    }
    
    if (this.state.redirect) {
      return (<Redirect to={'/' + this.state.redirect} />);
    }
    // console.log(this.state.redirect);
    const Fields = this.state.signers.map((person) =>
        (<li 
        key={person._id}
        >
        <a href="javascript:void(0)" id={'signer_'+person._id} className="btn sign-btn" className="btn"><span class="custom-icons" style={{'backgroundColor':person.color,'padding':'5px'}}></span><span style={{paddingLeft:'5px'}}>{person.name}</span></a>
        </li>)
    );
    if (!localStorage.getItem('jwtToken') && !this.state.doc_for_sign) {
      return <Redirect to='/'  />
    }else{
      dashboard = <li><NavLink  className="btn" id="dashboard" to='/dashboard'>Dasboard</NavLink></li>
    }
    let save_btn = (<a className="btn btn-done nav-link" onClick={this.saveData.bind(this)} href="javascript:void(0)">SaveE</a>);
    if (this.state.doc_for_sign && !this.state.allOk){
      save_btn = (<a className="btn btn-done nav-link" onClick={this.enterData.bind(this)} href="javascript:void(0)">Start</a>);
    }
    let required_msg = this.state.signers_err ? (<h3 className="text-center" style={{color:'red'}}>{this.state.signers_err}</h3>) : '';
    return (
      <div>
         <div>
        <Modal 
       title="Sign Through OTP" 
       visible={this.state.isModalVisible} 
       footer={[
          <Button key="back" onClick={this.handleCancel}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={this.saveData.bind(this)} disabled={!this.state.verified}>
            Save
          </Button>,
        ]}
        >
         { this.state.showVerifyOtp ?
           <div>
             <Row justify={'space-around'}> 
               <Col>
             <Form onFinish={this.handleVerify} >
            <Form.Item
              name='code'
              label='Code'
              rules={[
                { required: true, message: "Code is Required" },
              ]}
            >
              <Input  placeholder="Enter code" />
            </Form.Item>
           
            <Form.Item label=" " colon={false}>
              <Button type="primary" htmlType="submit" disabled={this.state.verified}>
                Verify 
              </Button>
            </Form.Item>
          </Form>
          </Col>
          <Col>
          {this.state.verified && <div><CheckCircleTwoTone twoToneColor="#52c41a" style={{fontSize:'30px', marginLeft:'20px', marginTop:'10px'}}/>
          <Row justify={'center'}>
            <Typography.Title level={3}>Verified ! </Typography.Title>
          </Row></div>}

          {this.state.notVerified && <div>
          <CloseCircleTwoTone twoToneColor="red" style={{fontSize:'30px', marginLeft:'20px', marginTop:'10px'}}/>
          <Row justify={'center'}>
            <Typography.Title level={3}>Verification Failed </Typography.Title>
          </Row>
          </div>}
          
          </Col>
          </Row>
          <Row>
          <Tooltip title={'Resend Code'}>
                <RetweetOutlined onClick={()=>{this.setState({showVerifyOtp:false})}} style={{fontSize:'22px', marginLeft:'20px', marginTop:'10px'}}/>
          </Tooltip>
          </Row>
          </div>
         :
          <div>
          <Form onFinish={this.handleGetCode} >
            <Form.Item
              name='mobile'
              label='Mobile Number'
              rules={[
                { required: true, message: "Mobile Number is required" },
                { pattern:'^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$', message: 'Mobile number not valid' }
              ]}
            >
              <Input  placeholder="Number with country Code" />
            </Form.Item>

            <Form.Item label=" " colon={false}>
              <Button type="primary" htmlType="submit">
                Get Code
              </Button>
            </Form.Item>
         </Form>
         </div>
         }
      </Modal>
      </div>
        <header>
         <nav className="navbar navbar-expand-lg navbar-light custom-navheader navbar-fixed header-template" id="sroll-className">
      <div className="container-fluid">
        <div className="col-md-12">
          <div className="row">
            <a className="navbar-brand d-lg-block d-md-block" href="/"><img src="/assets/img/fina-logo.png" alt=""/></a>
            <button className="navbar-toggler hamburger-btn collapsed" type="button" data-toggle="collapse" data-target="#navbarCollapse" aria-controls="navbarCollapse" aria-expanded="false" aria-label="Toggle navigation">
						<div className="hamburger">
							<span></span>
							<span></span>
							<span></span>
						</div>
						<div className="cross">
							<span></span>
							<span></span>
						</div>
					</button>
            <div className="collapse navbar-collapse navigation-bar2" id="navbarCollapse">
              <ul className="navbar-nav ml-auto custom-nav">
                {/* <li className="nav-item active">
                   <a className="nav-link" href="#" target="_blank" id="pdf-download-link"><i className="fa fa-download"></i></a>
                </li> */}
                {
                  this.state.doc_for_sign &&
                  <li className="nav-item">
                 <a className="btn btn-done nav-link" onClick={this.showOtpPanel.bind(this)} href="javascript:void(0)">Sign through OTP</a>
                </li>
                }
                 
                <li className="nav-item">
                   {save_btn}
                </li>

                <li className="nav-item active">
                  <a className="nav-link save-link"  target="_blank" id="pdf-download-link" href="javascript:void(0)"><i className="material-icons">save_alt</i></a>
                </li>
							{/* <li className="nav-item dropdown notify">
								<a className="nav-link" href="#" id="navbarDropdownMenuLink" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
								  <i className="material-icons">mail_outline</i>
								  <span className="notification">5</span>
								  <p className="d-lg-none d-md-block">
									Some Actions
								  </p>
								<div className="ripple-container"></div></a>
								<div className="dropdown-menu dropdown-menu-right" aria-labelledby="navbarDropdownMenuLink">
								  <a className="dropdown-item" href="#">Mike John responded to your email</a>
								  <a className="dropdown-item" href="#">You have 5 new tasks</a>
								  <a className="dropdown-item" href="#">You're now friend with Andrew</a>
								  <a className="dropdown-item" href="#">Another Notification</a>
								  <a className="dropdown-item" href="#">Another One</a>
								</div>
							</li> */}
							<li className="nav-item dropdown user-nv">
								<a className="nav-link profile-button" href="javascript:void(0);"data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
									<span className="avatar-status avatar-online">
										<img className="rounded-circle" src="http://162.144.215.8/~site4brandz/cphp/61/digis/content/images/avatar-1.jpg" alt="avatar" />
									</span>
									<span className="fa fa-caret-down"></span>	
								</a>
								<div className="dropdown-menu dropdown-menu-right" aria-labelledby="navbarDropdownMenuLink">
                  <NavLink to='/logout' className="btn btn-default btn-flat"><i className="material-icons">keyboard_tab</i>Logout</NavLink>
								</div>
							</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
         </nav>
      </header>
      {/* style={{paddingTop:'0px'}} */}
    <div className="container-fluid main-wrapper" >
      <div className="left-sidebar">
        {(() => {
          if(!this.state.doc_for_sign){
            return (<SignerFields 
              field={this.state.inputFields}
              setSignerField={this.setSignerField.bind(this)}
            />);
          }
        })()}

        {(() => {
          if(!this.state.doc_for_sign){
            return (<ul className="btn-list">
                    <li>
                      <div id="accordion" className="inner-accordian">
                        <div className="card">
                          <div className="card-header" id="headingOne">
                            <button className="btn btn-link" data-toggle="collapse" data-target="#collapseOne" aria-expanded="false" aria-controls="collapseOne">
                            Add Content to document
                            </button>
                          </div>
                          <div id="collapseOne" className="collapse  show" aria-labelledby="headingOne" data-parent="#accordion">
                            <div className="card-body">
                              <ol className="btn-mainlist">
                              {dashboard}
                                <li><a href="javascript:void(0)" id="sign_pad" className="btn sign-btn" onClick={this.showSignatureField.bind(this)} data-toggle="modal" data-target="#Signfiled"><span class="material-icons">border_color</span> Signature</a></li>
                                <li><a href="javascript:void(0)" id="text_field" className="btn" onClick={this.createTextField.bind(this)}><span class="material-icons">text_fields</span> Text</a></li>
                                <li><a href="javascript:void(0)" id="date_field" className="btn" onClick={this.createDateField.bind(this)}><span class="material-icons">insert_invitation</span> Date</a></li>
                                <li><a href="javascript:void(0)" id="initial_field" className="btn" onClick={this.showInitialField.bind(this)}><span class="material-icons">adjust</span> Initials</a></li>
                                <li><a href="javascript:void(0)" id="check_field" className="btn" onClick={this.showCheckField.bind(this)}><span class="material-icons">done_all</span> Check</a></li>
                                <li><a href="javascript:void(0)" id="clear_field" className="btn" onClick={this.clearContainer.bind(this)}><span class="material-icons">clear_all</span> Clear</a></li>
                              </ol>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  </ul>);
          }
        })()}
            {(() => {
              if (!this.state.doc_for_sign) {
                return (<ul className="btn-list">
                          <li>
                          <div id="accordion" className="inner-accordian">
                              <div className="card">
                              <div className="card-header" id="headingTwo">
                                  <button className="btn btn-link" data-toggle="collapse" data-target="#collapseTwo" aria-expanded="true" aria-controls="collapseTwo">
                                  Signers List
                                  {/* <span className="btn-helper">for signers</span> */}
                                  </button>
                              </div>
                              <div id="collapseTwo" className="collapse show" aria-labelledby="headingTwo" data-parent="#accordion">
                                  <div className="card-body">
                                  <ol className="btn-mainlist">
                                      {Fields}
                                  </ol>
                                  </div>
                              </div>
                              </div>
                          </div>
                          </li>
                </ul>);
              }
            })()}
        {/* <AddedSigners
          signer_ids={this.state.signer_ids}
        /> */}
      </div>
      <DropArea 
      docs={docs}
      edit_id={this.state.edit_id}
      field_type={this.state.inputFields} 
      getSignPosition={this.getSignPosition.bind(this)}
      showInitialField={this.showInitialField.bind(this)} 
      showSignatureField={this.showSignatureField.bind(this)}
      oneTimeLoad={this.oneTimeLoad.bind(this)}
      onetimeload_={this.state.onetimeload}
      closeAttempt={this.closeAttempt.bind(this)}
      refreshSigners={this.refreshSigners.bind(this)}
      updateTab={this.updateTab.bind(this)}
      checkAllOk={this.checkAllOk.bind(this)}
      sign_image={this.state.sign_image} 
      sign_text={this.state.sign_text}
      sign_texts={this.state.sign_texts} 
      sign_font={this.state.sign_font} 
      sign_color={this.state.color}
      signer_field={this.state.signer_field}
      doc_for_sign={this.state.doc_for_sign}
      top={this.state.top}
      left={this.state.left}
      doc_id={this.state.doc_id}
      signer_id={this.state.signer_id}
      first_attempt={this.state.first_attempt}
      signer_clr={this.state.signer_clr}
      allOk={this.state.allOk}
      field_required={this.state.field_required}
      />
    </div>
    <div className="modal signmodal signature_modal" id="Signfiled">
	<div className="modal-dialog modal-lg">
		<div className="modal-content">
			<div className="modal-header">
				<button type="button" className="close" data-dismiss="modal">&times;</button>
				<div className="col-12 p-0 tabnav-top">
        <ul className="nav nav-tabs" id="sign_nav_tabs">
						<li className="nav-item">
							<a className="nav-link " id="type_" onClick={this.resetTabs.bind(this)} data-toggle="tab" href="#type">Type</a>
						</li>
						<li className="nav-item">
							<a className="nav-link active" id="draw_" onClick={this.resetTabs.bind(this)} data-toggle="tab" href="#draw">Draw</a>
						</li>
						<li className="nav-item">
							<a className="nav-link" id="upload_" onClick={this.resetTabs.bind(this)} data-toggle="tab" href="#upload">Upload</a>
						</li>
					</ul>
				</div>
			</div>
			<div className="modal-body">
				<div className="container-fluid">
					<div className="tab-content">
						<div className="tab-pane" id="type">
							<div className="col-12 p-0">
								<div className="col-md-12 textinput p-0">
									<input id="signatureTextInput" className="form-control" onChange={this.appendSignFont.bind(this)} placeholder="Type your name here"/>
								</div>
								<div className="col-md-12 textinput">
									<ul className="col-list">
										<li className="card prev-box preview cedarville_cursive black-txt" onClick={this.setSignFont.bind(this,'Cedarville cursive')} style={{color:this.state.color}}>Type your name here</li>
                    <li className="card prev-box preview kristi black-txt" onClick={this.setSignFont.bind(this,'Kristi')} style={{color:this.state.color}}>Type your name here</li>
                    <li className="card prev-box preview mr_dafo black-txt" onClick={this.setSignFont.bind(this,'Mr Dafoe')} style={{color:this.state.color}}>Type your name here</li>
                    <li className="card prev-box preview sacramento black-txt" onClick={this.setSignFont.bind(this,'Sacramento')} style={{color:this.state.color}}>Type your name here</li>
                    <li className="card prev-box preview montez black-txt" onClick={this.setSignFont.bind(this,'Montez')} style={{color:this.state.color}}>Type your name here</li>
                    <li className="card prev-box preview reenie_beanie black-txt" onClick={this.setSignFont.bind(this,'Reenie Beanie')} style={{color:this.state.color}}>Type your name here</li>
									</ul>
								</div>
							</div>
						</div>
						<div className="tab-pane container fade active show" id="draw">
							<div className="col-12 p-0">
								<div className="signature-area">
                  <Sign 
                    w="800" 
                    h="300" 
                    t={this.state.top} 
                    l={this.state.left} 
                    docId={this.state.doc_id} 
                    color={this.state.color}
                    bind_signature={this.state.bind_signature}
                    updateSignField={this.updateSignField.bind(this)}
                    updateSignFieldType={this.updateSignFieldType.bind(this)}
                    doc_for_sign={this.state.doc_for_sign}
                    />
								</div>
							</div>
						</div>
						<div className="tab-pane container fade" id="upload">
							<div className="col-12 p-0">
								<div className="photo-area" styl="width:100%; height:250px;">
									<div className="col-md-12 text-center imguploadwrapper">
										<p>Upload an image of your signature</p>
										<div className="upload-box">
											<input type="file" onChange={this.docUpload} />
											<label><button>Upload Signature</button></label>
										</div>
									</div>
									<p className="clear-link"><a href="javascript:void(0)" onClick={this.removeSignature.bind(this)}>clear</a></p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div className="modal-footer">
				<div className="row">
					<div className="col-md-6 pl-0">
						<ul className="list-inline color-list">
							<li className="black"><input name="color" value="black" type="radio" onChange={this.saveColor.bind(this)} /><label></label></li>
							<li className="blue"><input name="color" value="blue" type="radio" onChange={this.saveColor.bind(this)}/><label></label></li>
							<li className="green"><input name="color" value="green" type="radio" onChange={this.saveColor.bind(this)}/><label></label></li>
						</ul>
					</div>
					<div className="col-md-6">
						<div className="d-flex btn-block pull-right">
							<button type="button" className="btn btn-default close_btn" id="close_btn" data-dismiss="modal">Cancel</button>
							<button className="btn btn-primary btn-large" onClick={this.appendSignature.bind(this)}>Sign</button>
						</div>
					</div>
					</div>
				</div>
			</div>
		</div>
	</div>

  <div className="modal fade" id="add_signer" role="dialog">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-body">
                  <div className="col-md-12 col-md-offset-4">
                        <div className="panel panel-default">
                          <div className="panel-body">
                            <div className="text-center">
                                <h3><i className="fa fa-sign-in fa-4x"></i></h3>
                                <h2 className="text-center">Field Properties</h2>
                                {required_msg}
                                <div className="panel-body">
                                {(() => {
                                  if (this.state.showSigner) {
                                    return (<div className="form-group">
                                      <div className="input-group">
                                        <span className="input-group-addon"><i className="glyphicon glyphicon-envelope color-blue"></i></span>
                                        <input id="signer" name="signer" placeholder="Who is filling in this field?" onChange={this.handleChange} className="form-control" type="text" />
                                      </div>
                                    </div>);
                                  }
                                })()}
                                    <div className="form-group">
                                      <div className="input-group">
                                        <span className="input-group-addon"><i className="glyphicon glyphicon-envelope color-blue"></i></span>
                                        <select name="exist_signer" id="exist_signer" onChange={this.handleChange}>
                                        <option value=''>Select Signer</option>
                                        {this.state.signers.map((person) => <option id={person._id} key={person._id}>{person.name}</option>)}
                                        </select>
                                      </div>
                                    </div>
                          <div className="form-group">
                            <div className="input-group">
                              <a href="javascript:void(0)" class="btn-default" style={{ textDecoration: 'none', outline: 'none' }} onClick={this.showHideAddSigner} >Add Signer</a>
                            </div>
                          </div>
                                    <div className="form-group">
                                      <div className="input-group">
                                        <label className="input-group-addon">Field Required</label>
                              <input name="field_required" onChange={this.handleChange} className="form-control" checked={this.state.checked} type="checkbox" value="required" />
                                      </div>
                                    </div>
                                    <div className="form-group">
                                      <input name="recover-submit" className="btn btn-lg btn-primary btn-block" value="Add Field" onClick={this.addField} type="button" />
                                    </div>
                                </div>
                            </div>
                          </div>
                        </div>
                  </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-default" data-dismiss="modal">Cancel</button>
              </div>
            </div>
          </div>
       </div>
    </div>
    
    )
    
  }
}
// console.log(Signature)
// debugger;
export default Signature_edit;
