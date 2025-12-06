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
  View, Alert, StatusBar, Modal, Image, ImageBackground, PermissionsAndroid, Platform, ActivityIndicator
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import TcpSocket from 'react-native-tcp-socket';
import RNFS from 'react-native-fs';

const SAMPLE_PDF_BASE64 = "JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmoKPDwKICAvVHlwZSAvUGFnZXwKICAvTWVkaWFCb3ggWyAwIDAgMjAwIDIwMCBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0KPj4KZW5kb2JqCgozIDAgb2JqCjw8CiAgL1R5cGUgL1BhZ2UKICAvUGFyZW50IDIgMCBSCiAgL1Jlc291cmNlcyA8PAogICAgL0ZvbnQgPDwKICAgICAgL0YxIDQgMCBSCjI+CiAgICA+PgogID4+CiAgL0NvbnRlbnRzIDUgMCBSCj4+CmVuZG9iagoKNCAwIG9iago8PAogIC9UeXBlIC9Gb250CiAgL1N1YnR5cGUgL1R5cGUxCiAgL0Jhc2VGb250IC9UaW1lcy1Sb21hbgo+PgplbmRvYmoKCjUgMCBvYmoKPDwgL0xlbmd0aCA0NCA+PgpzdHJlYW0KQlQKNzAgNTAgVGQKL0YxIDEyIFRmCihEb2MgQ2hhdE5FVCkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDEwIDAwMDAwIG4gCjAwMDAwMDAwNjAgMDAwMDAgbiAKMDAwMDAwMDE1NyAwMDAwMCBuIAowMDAwMDAwMjU1IDAwMDAwIG4gCjAwMDAwMDAzNDQgMDAwMDAgbiAKdHJhaWxlcgo8PAogIC9TaXplIDYKICAvUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNDQxCiUlRU9FCg==";

const MY_LISTENING_PORT = 9000; 
const DELIMITER = "|||END|||"; 
// TĂNG KÍCH THƯỚC GÓI TIN LÊN 60KB ĐỂ GỬI VIDEO NHANH HƠN
const CHUNK_SIZE = 1024 * 60; 

// --- HÀM MÃ HÓA ---
const caesarCipher = (str: string, shift: number, decrypt: boolean = false) => {
  if (decrypt) shift = (26 - shift) % 26;
  return str.replace(/[a-zA-Z]/g, (c) => {
    const base = c >= 'a' ? 97 : 65;
    return String.fromCharCode(((c.charCodeAt(0) - base + shift) % 26) + base);
  });
};
const rsaEncrypt = (text: string) => {
    const reversed = text.split('').reverse().join('');
    return `RSA:${CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(reversed))}`;
};
const rsaDecrypt = (text: string) => {
    if (!text.startsWith("RSA:")) return text;
    try {
        const b64 = text.replace("RSA:", "");
        return CryptoJS.enc.Base64.parse(b64).toString(CryptoJS.enc.Utf8).split('').reverse().join('');
    } catch (e) { return text; }
};

interface Message {
  type: 'text' | 'image' | 'pdf' | 'video';
  content: string;
  sender: 'me' | 'other';
  timestamp: Date;
  algo: string;
}

function App(): React.JSX.Element {
  const [myIp, setMyIp] = useState<string>('...');
  const [targetIp, setTargetIp] = useState<string>('');
  const [targetPort, setTargetPort] = useState<string>('9000');
  const [message, setMessage] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAlgoMenu, setShowAlgoMenu] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState<string>('123'); 
  const [selectedAlgo, setSelectedAlgo] = useState<'AES'|'DES'|'RSA'|'CAESAR'>('AES');
  
  const serverRef = useRef<any>(null);
  const encryptionKeyRef = useRef(encryptionKey);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => { encryptionKeyRef.current = encryptionKey; }, [encryptionKey]);

  useEffect(() => {
    NetInfo.fetch().then(state => setMyIp((state.details as any)?.ipAddress || 'Lỗi IP'));
    startServer();

    if(Platform.OS === 'android') {
        if (Platform.Version >= 33) {
            PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
                PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
            ]);
        } else {
            PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
                PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
            ]);
        }
    }
    return () => { if (serverRef.current) serverRef.current.close(); };
  }, []);

  const processIncomingData = async (rawString: string) => {
    try {
        const parts = rawString.split('|');
        if (parts.length < 3) return;

        const typeStr = parts[0];
        const algoUsed = parts[1];
        const encryptedContent = parts[2];
        const key = encryptionKeyRef.current;
        let content = "";

        // GIẢI MÃ
        // Nếu algo là NONE (video) thì lấy trực tiếp content
        if (algoUsed === 'NONE') {
            content = encryptedContent;
        } else if (algoUsed === 'AES') {
            content = CryptoJS.AES.decrypt(encryptedContent, key).toString(CryptoJS.enc.Utf8);
        } else if (algoUsed === 'DES') {
            content = CryptoJS.DES.decrypt(encryptedContent, key).toString(CryptoJS.enc.Utf8);
        } else if (algoUsed === 'CAESAR') {
            content = caesarCipher(encryptedContent, 3, true);
        } else if (algoUsed === 'RSA') {
            content = rsaDecrypt(encryptedContent);
        } else {
            content = encryptedContent;
        }

        if (!content && typeStr !== 'IMG' && typeStr !== 'PDF' && typeStr !== 'VID') content = "[Lỗi giải mã]";
        
        if (typeStr === 'VID') {
            try {
                if(!content) content = encryptedContent;
                const path = `${RNFS.DocumentDirectoryPath}/video_receive_${new Date().getTime()}.mp4`;
                await RNFS.writeFile(path, content, 'base64');
                content = "Đã lưu tại: " + path;
            } catch(err) { content = "Lỗi lưu video"; }
        } else if ((typeStr === 'IMG' || typeStr === 'PDF') && !content) {
            content = encryptedContent;
        }

        let msgType: 'text'|'image'|'pdf'|'video' = 'text';
        if (typeStr === 'IMG') msgType = 'image';
        if (typeStr === 'PDF') msgType = 'pdf';
        if (typeStr === 'VID') msgType = 'video';

        setMessages(prev => [...prev, { type: msgType, content, sender: 'other', timestamp: new Date(), algo: algoUsed }]);
    } catch (e) { console.log('Lỗi xử lý tin đến:', e); }
  };

  const startServer = () => {
    try {
      const server = TcpSocket.createServer((socket: any) => {
        let buffer = ''; // Buffer riêng cho mỗi client

        socket.on('data', (data: any) => {
          buffer += data.toString('utf8');
          
          let index = buffer.indexOf(DELIMITER);
          while (index !== -1) {
            const messageData = buffer.substring(0, index);
            if (messageData.trim()) {
                processIncomingData(messageData);
            }
            buffer = buffer.substring(index + DELIMITER.length);
            index = buffer.indexOf(DELIMITER);
          }
        });

        socket.on('error', (err: any) => console.log('Socket error:', err));
      });

      server.listen({ port: MY_LISTENING_PORT, host: '0.0.0.0' });
      serverRef.current = server;
    } catch (e) { Alert.alert('Lỗi Server', "Cổng bận"); }
  };

  // --- SỬA LOGIC GỬI ĐỂ CHẠY ĐƯỢC VIDEO ---
  const sendData = async (rawData: string, type: 'text'|'image'|'pdf'|'video') => {
    if (!targetIp.trim()) { Alert.alert('Lỗi', 'Chưa nhập IP nhận'); setLoading(false); return; }

    let finalAlgo = selectedAlgo;
    let encrypted = rawData;

    try {
        // --- QUAN TRỌNG: NẾU LÀ VIDEO, TẮT MÃ HÓA ĐỂ TRÁNH CRASH APP ---
        if (type === 'video') {
             finalAlgo = 'NONE'; // Bắt buộc chuyển về không mã hóa
             encrypted = rawData; // Giữ nguyên Base64
        } else {
             // Các loại khác mã hóa bình thường
             if (selectedAlgo === 'AES') encrypted = CryptoJS.AES.encrypt(rawData, encryptionKey).toString();
             else if (selectedAlgo === 'DES') encrypted = CryptoJS.DES.encrypt(rawData, encryptionKey).toString();
             else if (selectedAlgo === 'CAESAR') encrypted = caesarCipher(rawData, 3);
             else if (selectedAlgo === 'RSA') encrypted = rsaEncrypt(rawData);
        }
    } catch (e) {
        Alert.alert("Lỗi", "File quá lớn để mã hóa!");
        setLoading(false);
        return;
    }

    let typeHeader = 'TXT';
    if(type === 'image') typeHeader = 'IMG';
    if(type === 'pdf') typeHeader = 'PDF';
    if(type === 'video') typeHeader = 'VID';

    const fullPacket = `${typeHeader}|${finalAlgo}|${encrypted}${DELIMITER}`;
    
    // GỬI CHUNKING (CHIA NHỎ GÓI TIN)
    const client = TcpSocket.createConnection({ port: parseInt(targetPort), host: targetIp }, () => {
        let offset = 0;
        const totalSize = fullPacket.length;
        
        const writeChunk = () => {
            if (offset >= totalSize) {
                setMessages(prev => [...prev, { type, content: rawData, sender: 'me', timestamp: new Date(), algo: finalAlgo }]);
                setLoading(false);
                client.destroy(); 
                return;
            }

            // Cắt gói tin 60KB
            const chunk = fullPacket.slice(offset, offset + CHUNK_SIZE);
            const canWriteMore = client.write(chunk, 'utf8');
            offset += CHUNK_SIZE;

            if (canWriteMore) {
                // Nếu socket rảnh, gửi tiếp ngay lập tức (dùng setImmediate để không đơ UI)
                setImmediate(writeChunk); 
            } else {
                // Nếu socket bận, đợi sự kiện drain
                client.once('drain', writeChunk);
            }
        };

        writeChunk();
    });

    client.on('error', (e) => { 
        console.log("Socket Error:", e); 
        setLoading(false); 
        Alert.alert("Lỗi Gửi", "Không kết nối được"); 
    });
    
    // Tăng thời gian chờ lên 60 giây để kịp gửi video
    client.setTimeout(60000); 
    client.on('timeout', () => {
        client.destroy();
        setLoading(false);
        Alert.alert("Lỗi", "Gửi quá lâu (Timeout)");
    });
  };

  const handlePickImage = () => {
    launchImageLibrary({mediaType: 'photo', includeBase64: true, maxWidth: 800, quality: 0.7}, (response: any) => {
      if (response.assets && response.assets[0]?.base64) sendData(response.assets[0].base64, 'image');
    });
  };

  const handlePickVideo = () => {
      launchImageLibrary({mediaType: 'video'}, async (response) => {
          if (response.assets && response.assets[0].uri) {
              const fileSize = response.assets[0].fileSize; 
              // Giới hạn 50MB để đảm bảo JS xử lý nổi
              if (fileSize && fileSize > 50 * 1024 * 1024) { 
                  Alert.alert("File quá lớn", "Chỉ hỗ trợ video < 50MB");
                  return;
              }

              setLoading(true);
              try {
                  const uri = response.assets[0].uri;
                  const base64 = await RNFS.readFile(uri, 'base64');
                  sendData(base64, 'video');
              } catch (e) {
                  Alert.alert("Lỗi", "Không đọc được video!");
                  setLoading(false);
              }
          }
      });
  };

  const handleSendPDF = () => sendData(SAMPLE_PDF_BASE64, 'pdf');

  const renderContent = (msg: Message) => {
    if (msg.type === 'image') return <Image source={{uri: `data:image/jpeg;base64,${msg.content}`}} style={{width:120, height:120, borderRadius:10}}/>;
    if (msg.type === 'pdf') return <Text style={{fontWeight:'bold', color: msg.sender==='me'?'white':'black'}}>📄 Bao_cao_ltmm.pdf</Text>;
    if (msg.type === 'video') {
        return (
          <View style={{flexDirection:'row', alignItems:'center'}}>
            <Text style={{fontSize: 24}}>🎬</Text>
            <View style={{marginLeft: 5}}>
                <Text style={{fontWeight:'bold', color: msg.sender==='me'?'white':'black'}}>Video.mp4</Text>
                <Text style={{fontSize: 10, color: msg.sender==='me'?'#eee':'#555'}}>
                    {msg.sender==='me' ? 'Đã gửi' : 'Đã lưu'}
                </Text>
            </View>
          </View>
        );
    }
    return <Text style={{color:msg.sender==='me'?'white':'black'}}>{msg.content}</Text>;
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0084ff" />
      <ImageBackground source={require('./assets/Logo.jpg')} style={{flex:1}} imageStyle={{opacity:0.1}}>
        <SafeAreaView style={{flex:1}}>
          <View style={styles.header}>
            <Text style={styles.title}>ChatNET Final</Text>
            <TouchableOpacity onPress={() => setShowSettingsModal(true)}><Text style={{fontSize:24}}>⚙️</Text></TouchableOpacity>
          </View>

          {loading && (
            <View style={{position:'absolute', top:0,bottom:0,left:0,right:0, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'center', alignItems:'center', zIndex:999}}>
                <ActivityIndicator size="large" color="white"/>
                <Text style={{color:'white', marginTop:10}}>Đang xử lý...</Text>
            </View>
          )}

          <Modal visible={showSettingsModal} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Cài Đặt</Text>
                
                <Text style={{marginTop:10, fontWeight:'bold'}}>IP Người Nhận:</Text>
                <TextInput style={styles.input} placeholder="10.0.2.2" value={targetIp} onChangeText={setTargetIp} keyboardType="numeric"/>
                
                <Text style={{marginTop:10, fontWeight:'bold', color:'red'}}>Port Người Nhận:</Text>
                <TextInput style={styles.input} value={targetPort} onChangeText={setTargetPort} keyboardType="numeric" placeholder="9000"/>

                <Text style={{marginTop:10, fontWeight:'bold'}}>Secret Key (AES/DES):</Text>
                <TextInput style={styles.input} value={encryptionKey} onChangeText={setEncryptionKey}/>
                
                <TouchableOpacity onPress={()=>setShowSettingsModal(false)} style={styles.btn}><Text style={{color:'white'}}>LƯU</Text></TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Modal visible={showAlgoMenu} transparent animationType="fade">
            <TouchableOpacity style={styles.modalOverlay} onPress={()=>setShowAlgoMenu(false)}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Chọn Mã Hóa</Text>
                {['AES', 'DES', 'RSA', 'CAESAR'].map(item => (
                    <TouchableOpacity key={item} onPress={()=>{setSelectedAlgo(item as any); setShowAlgoMenu(false)}} style={{padding:15, borderBottomWidth:1, borderColor:'#eee'}}>
                        <Text style={{fontWeight: selectedAlgo===item?'bold':'normal', color:'black', textAlign:'center'}}>{item}</Text>
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
                  <Text style={{fontSize:10, color:m.sender==='me'?'#eee':'#555', marginTop:5, textAlign:'right'}}>
                      {m.timestamp.toLocaleTimeString()} ({m.algo})
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.inputBar}>
            <TouchableOpacity onPress={()=>setShowAlgoMenu(true)} style={{padding:10, marginRight:5}}>
                <Text style={{fontWeight:'bold', color:'blue'}}>{selectedAlgo} ▼</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSendPDF} style={{padding:8}}><Text style={{fontSize:22}}>📎</Text></TouchableOpacity>
            <TouchableOpacity onPress={handlePickVideo} style={{padding:8}}><Text style={{fontSize:22}}>🎥</Text></TouchableOpacity>
            <TouchableOpacity onPress={handlePickImage} style={{padding:8}}><Text style={{fontSize:22}}>📷</Text></TouchableOpacity>
            <TextInput style={styles.textInput} value={message} onChangeText={setMessage} placeholder="Nhập tin..."/>
            <TouchableOpacity onPress={()=>{if(message.trim()){sendData(message.trim(), 'text'); setMessage('')}}} style={styles.sendBtn}><Text style={{color:'white'}}>GỬI</Text></TouchableOpacity>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </>
  );
}

const styles = StyleSheet.create({
  header: {padding:15, backgroundColor:'#0084ff', flexDirection:'row', justifyContent:'space-between', alignItems:'center'},
  title: {color:'white', fontSize:20, fontWeight:'bold'},
  row: {marginVertical:5, flexDirection:'row'}, rowMe: {justifyContent:'flex-end'}, rowOther: {justifyContent:'flex-start'},
  bubble: {padding:10, borderRadius:10, maxWidth:'75%'}, bubbleMe: {backgroundColor:'#0084ff'}, bubbleOther: {backgroundColor:'white'},
  inputBar: {padding:10, backgroundColor:'white', flexDirection:'row', alignItems:'center'},
  textInput: {flex:1, borderWidth:1, borderColor:'#ddd', borderRadius:20, paddingHorizontal:15, height:40, marginHorizontal:5},
  sendBtn: {backgroundColor:'#0084ff', padding:10, borderRadius:20},
  modalOverlay: {flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'center', alignItems:'center'},
  modalContent: {width:'80%', backgroundColor:'white', padding:20, borderRadius:10},
  modalTitle: {fontSize:18, fontWeight:'bold', marginBottom:10, textAlign:'center'},
  input: {borderWidth:1, borderColor:'#ddd', padding:10, marginVertical:5, borderRadius:5},
  btn: {backgroundColor:'#0084ff', padding:10, alignItems:'center', borderRadius:5, marginTop:10}
});
export default App;