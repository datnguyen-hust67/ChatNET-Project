// --- 1. POLYFILL (GIỮ NGUYÊN) ---
const randomBytes = (length: number) => {
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytes;
};

if (!global.crypto) { (global as any).crypto = {}; }
if (!(global as any).crypto.getRandomValues) {
  (global as any).crypto.getRandomValues = (array: any) => {
    const bytes = randomBytes(array.length);
    for (let i = 0; i < array.length; i++) { array[i] = bytes[i]; }
    return array;
  };
}

// --- 2. MODULES ---
const CryptoJS = require('crypto-js');
const { launchImageLibrary } = require('react-native-image-picker'); 

// --- 3. IMPORTS ---
import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity,
  View, Alert, StatusBar, Modal, Image, ImageBackground,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import TcpSocket from 'react-native-tcp-socket';

// --- FILE PDF MẪU (GIỮ NGUYÊN) ---
const SAMPLE_PDF_BASE64 = "JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmoKPDwKICAvVHlwZSAvUGFnZXwKICAvTWVkaWFCb3ggWyAwIDAgMjAwIDIwMCBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0KPj4KZW5kb2JqCgozIDAgb2JqCjw8CiAgL1R5cGUgL1BhZ2UKICAvUGFyZW50IDIgMCBSCiAgL1Jlc291cmNlcyA8PAogICAgL0ZvbnQgPDwKICAgICAgL0YxIDQgMCBSCjI+CiAgICA+PgogID4+CiAgL0NvbnRlbnRzIDUgMCBSCj4+CmVuZG9iagoKNCAwIG9iago8PAogIC9UeXBlIC9Gb250CiAgL1N1YnR5cGUgL1R5cGUxCiAgL0Jhc2VGb250IC9UaW1lcy1Sb21hbgo+PgplbmRvYmoKCjUgMCBvYmoKPDwgL0xlbmd0aCA0NCA+PgpzdHJlYW0KQlQKNzAgNTAgVGQKL0YxIDEyIFRmCihEb2MgQ2hhdE5FVCkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDEwIDAwMDAwIG4gCjAwMDAwMDAwNjAgMDAwMDAgbiAKMDAwMDAwMDE1NyAwMDAwMCBuIAowMDAwMDAwMjU1IDAwMDAwIG4gCjAwMDAwMDAzNDQgMDAwMDAgbiAKdHJhaWxlcgo8PAogIC9TaXplIDYKICAvUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNDQxCiUlRU9FCg==";

const PORT = 9000; // Dùng cổng 9000
const DELIMITER = "|||END|||"; 

// --- HÀM MÃ HÓA BỔ SUNG ---
const caesarCipher = (str: string, shift: number, decrypt: boolean = false) => {
  if (decrypt) shift = (26 - shift) % 26;
  return str.replace(/[a-zA-Z]/g, (c) => {
    const base = c >= 'a' ? 97 : 65;
    return String.fromCharCode(((c.charCodeAt(0) - base + shift) % 26) + base);
  });
};
// RSA Giả lập (Để tránh lỗi thư viện native)
const rsaEncrypt = (text: string) => `RSA:${Buffer.from(text).toString('base64')}`;
const rsaDecrypt = (text: string) => {
  if (!text.startsWith("RSA:")) return text;
  return Buffer.from(text.replace("RSA:", ""), 'base64').toString('utf8');
};

interface Message {
  type: 'text' | 'image' | 'pdf';
  content: string;
  sender: 'me' | 'other';
  timestamp: Date;
  algo: string; // Thêm trường này
}

function App(): React.JSX.Element {
  const [myIp, setMyIp] = useState<string>('...');
  const [targetIp, setTargetIp] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Cài đặt
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAlgoMenu, setShowAlgoMenu] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState<string>('123'); 
  const [selectedAlgo, setSelectedAlgo] = useState<'AES'|'DES'|'RSA'|'CAESAR'>('AES');
  
  const serverRef = useRef<any>(null);
  const encryptionKeyRef = useRef(encryptionKey);
  const scrollViewRef = useRef<ScrollView>(null);
  const bufferRef = useRef<string>("");

  useEffect(() => { encryptionKeyRef.current = encryptionKey; }, [encryptionKey]);

  useEffect(() => {
    NetInfo.fetch().then(state => setMyIp((state.details as any)?.ipAddress || 'Lỗi IP'));
    startServer();
    return () => { if (serverRef.current) serverRef.current.close(); };
  }, []);

  const processIncomingData = (rawString: string) => {
    try {
        // Format mới: TYPE|ALGO|CONTENT
        const parts = rawString.split('|');
        if (parts.length < 3) return;

        const typeStr = parts[0];
        const algoUsed = parts[1];
        const contentEnc = parts[2];
        let content = "";
        const key = encryptionKeyRef.current;

        // GIẢI MÃ
        if (algoUsed === 'AES') content = CryptoJS.AES.decrypt(contentEnc, key).toString(CryptoJS.enc.Utf8);
        else if (algoUsed === 'DES') content = CryptoJS.DES.decrypt(contentEnc, key).toString(CryptoJS.enc.Utf8);
        else if (algoUsed === 'CAESAR') content = caesarCipher(contentEnc, 3, true);
        else if (algoUsed === 'RSA') content = rsaDecrypt(contentEnc);
        else content = contentEnc;

        if (!content && typeStr !== 'IMG' && typeStr !== 'PDF') content = "[Lỗi giải mã]";
        if ((typeStr === 'IMG' || typeStr === 'PDF') && !content) content = contentEnc; // Fallback

        let msgType: 'text'|'image'|'pdf' = 'text';
        if (typeStr === 'IMG') msgType = 'image';
        if (typeStr === 'PDF') msgType = 'pdf';

        setMessages(prev => [...prev, { type: msgType, content, sender: 'other', timestamp: new Date(), algo: algoUsed }]);
    } catch (e) {}
  };

  const startServer = () => {
    try {
      const server = TcpSocket.createServer((socket: any) => {
        socket.on('data', (data: any) => {
          bufferRef.current += data.toString('utf8');
          if (bufferRef.current.includes(DELIMITER)) {
            const parts = bufferRef.current.split(DELIMITER);
            for (let i = 0; i < parts.length - 1; i++) {
              if (parts[i].trim()) processIncomingData(parts[i]);
            }
            bufferRef.current = parts[parts.length - 1];
          }
        });
      });
      server.listen({ port: PORT, host: '0.0.0.0' });
      serverRef.current = server;
    } catch (e) { Alert.alert('Lỗi Server', "Cổng bận"); }
  };

  const sendData = (rawData: string, type: 'text'|'image'|'pdf') => {
    if (!targetIp.trim()) { Alert.alert('Lỗi', 'Chưa nhập IP nhận'); return; }
    
    let encrypted = "";
    const key = encryptionKey;

    // MÃ HÓA
    try {
        if (selectedAlgo === 'AES') encrypted = CryptoJS.AES.encrypt(rawData, key).toString();
        else if (selectedAlgo === 'DES') encrypted = CryptoJS.DES.encrypt(rawData, key).toString();
        else if (selectedAlgo === 'CAESAR') encrypted = caesarCipher(rawData, 3);
        else if (selectedAlgo === 'RSA') encrypted = rsaEncrypt(rawData);
    } catch (e: any) { Alert.alert("Lỗi Mã Hóa", e.message); return; }

    // ĐÓNG GÓI: TYPE|ALGO|CONTENT|||END|||
    let header = 'TXT';
    if(type === 'image') header = 'IMG';
    if(type === 'pdf') header = 'PDF';

    const finalData = `${header}|${selectedAlgo}|${encrypted}${DELIMITER}`;

    const client = TcpSocket.createConnection({ port: PORT, host: targetIp }, () => {
      client.write(finalData, 'utf8', (err) => {
        if (!err) {
          setMessages(prev => [...prev, { type, content: rawData, sender: 'me', timestamp: new Date(), algo: selectedAlgo }]);
        }
      });
      // Đợi 500ms rồi mới ngắt để tin đi kịp
      setTimeout(() => client.destroy(), 500);
    });
    client.on('error', (e) => console.log(e));
  };

  const handlePickImage = () => {
    launchImageLibrary({mediaType: 'photo', includeBase64: true, maxWidth: 300, quality: 0.5}, (response: any) => {
      if (response.assets && response.assets[0]?.base64) sendData(response.assets[0].base64, 'image');
    });
  };

  const handleSendPDF = () => sendData(SAMPLE_PDF_BASE64, 'pdf');

  // UI Component
  const renderContent = (msg: Message) => {
    if (msg.type === 'image') return <Image source={{uri: `data:image/jpeg;base64,${msg.content}`}} style={{width:150, height:150, borderRadius:10}}/>;
    if (msg.type === 'pdf') return <Text style={{fontWeight:'bold', color: msg.sender==='me'?'white':'black'}}>📄 Bao_cao_ltmm.pdf</Text>;
    return <Text style={{color:msg.sender==='me'?'white':'black', fontSize:16}}>{msg.content}</Text>;
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0084ff" />
      <SafeAreaView style={{flex:1, backgroundColor:'#F0F0F0'}}>
          <View style={styles.header}>
            <Text style={styles.title}>ChatNET Pro - Team8 - ETTN</Text>
            <TouchableOpacity onPress={() => setShowSettingsModal(true)}><Text style={{fontSize:24}}>⚙️</Text></TouchableOpacity>
          </View>

          {/* SETTINGS */}
          <Modal visible={showSettingsModal} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Cài Đặt</Text>
                <Text>IP Của Bạn: {myIp}</Text>
                <Text style={{marginTop:10, fontWeight:'bold'}}>IP Người Nhận:</Text>
                <TextInput style={styles.input} placeholder="10.0.2.2" value={targetIp} onChangeText={setTargetIp} keyboardType="numeric"/>
                <Text style={{marginTop:10, fontWeight:'bold'}}>Secret Key (AES/DES):</Text>
                <TextInput style={styles.input} value={encryptionKey} onChangeText={setEncryptionKey}/>
                <TouchableOpacity onPress={()=>setShowSettingsModal(false)} style={styles.btn}><Text style={{color:'white'}}>LƯU</Text></TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* ALGO MENU */}
          <Modal visible={showAlgoMenu} transparent animationType="fade">
            <TouchableOpacity style={styles.modalOverlay} onPress={()=>setShowAlgoMenu(false)}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Chọn Mã Hóa</Text>
                {['AES', 'DES', 'RSA', 'CAESAR'].map(alg => (
                    <TouchableOpacity key={alg} onPress={()=>{setSelectedAlgo(alg as any); setShowAlgoMenu(false)}} style={{padding:15, borderBottomWidth:1, borderColor:'#eee'}}>
                        <Text style={{fontWeight: selectedAlgo===alg?'bold':'normal', color:'black', textAlign:'center'}}>{alg}</Text>
                    </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </Modal>

          <ScrollView ref={scrollViewRef} style={{flex:1, padding:10}} onContentSizeChange={()=>scrollViewRef.current?.scrollToEnd()}>
            {messages.map((m, i) => (
              <View key={i} style={[styles.row, m.sender==='me'?styles.rowMe:styles.rowOther]}>
                <View style={[styles.bubble, m.sender==='me'?styles.bubbleMe:styles.bubbleOther]}>
                  {renderContent(m)}
                  <Text style={{fontSize:10, color:'#ccc', marginTop:5, textAlign:'right'}}>{m.algo} • {m.timestamp.toLocaleTimeString()}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.inputBar}>
            <TouchableOpacity onPress={()=>setShowAlgoMenu(true)} style={{padding:10, backgroundColor:'#eee', borderRadius:5, marginRight:5}}>
                <Text style={{fontWeight:'bold', color:'blue'}}>{selectedAlgo} ▼</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSendPDF} style={{padding:10}}><Text style={{fontSize:22}}>📎</Text></TouchableOpacity>
            <TouchableOpacity onPress={handlePickImage} style={{padding:10}}><Text style={{fontSize:22}}>📷</Text></TouchableOpacity>
            <TextInput style={styles.textInput} value={message} onChangeText={setMessage} placeholder="Nhập tin..."/>
            <TouchableOpacity onPress={()=>{if(message.trim()){sendData(message.trim(), 'text'); setMessage('')}}} style={styles.sendBtn}><Text style={{color:'white'}}>GỬI</Text></TouchableOpacity>
          </View>
        </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  header: {padding:15, backgroundColor:'#0084ff', flexDirection:'row', justifyContent:'space-between', alignItems:'center'},
  title: {color:'white', fontSize:20, fontWeight:'bold'},
  row: {marginVertical:5, flexDirection:'row'}, rowMe: {justifyContent:'flex-end'}, rowOther: {justifyContent:'flex-start'},
  bubble: {padding:10, borderRadius:10, maxWidth:'75%'}, bubbleMe: {backgroundColor:'#0084ff'}, bubbleOther: {backgroundColor:'white'},
  inputBar: {padding:10, backgroundColor:'white', flexDirection:'row', alignItems:'center', borderTopWidth:1, borderColor:'#ddd'},
  textInput: {flex:1, borderWidth:1, borderColor:'#ddd', borderRadius:20, paddingHorizontal:15, height:40, marginHorizontal:5},
  sendBtn: {backgroundColor:'#0084ff', padding:10, borderRadius:20},
  modalOverlay: {flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'center', alignItems:'center'},
  modalContent: {width:'80%', backgroundColor:'white', padding:20, borderRadius:10},
  modalTitle: {fontSize:18, fontWeight:'bold', marginBottom:10, textAlign:'center'},
  input: {borderWidth:1, borderColor:'#ddd', padding:10, marginVertical:5, borderRadius:5},
  btn: {backgroundColor:'#0084ff', padding:10, alignItems:'center', borderRadius:5, marginTop:10}
});
export default App;