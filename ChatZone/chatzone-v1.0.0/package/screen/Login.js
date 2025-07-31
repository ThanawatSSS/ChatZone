import * as React from 'react';
import { Text, View, TextInput, Image, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FirebaseRecaptchaVerifierModal, FirebaseRecaptchaBanner } from 'expo-firebase-recaptcha';
import { initializeApp, getApp } from 'firebase/app';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useEffect, useState } from "react";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { getAuth, PhoneAuthProvider, signInWithCredential, signInWithEmailAndPassword, sendPasswordResetEmail, createUserWithEmailAndPassword } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import { getDatabase, ref, set, update } from 'firebase/database';
import firebase from 'firebase/compat/app';


WebBrowser.maybeCompleteAuthSession();

const firebaseConfig = {
  apiKey: "AIzaSyAWO15eZvc0YqFwz2NveXxwkS6Dzx-9waE",
  authDomain: "chatzone-66bca.firebaseapp.com",
  databaseURL: "https://chatzone-66bca-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "chatzone-66bca",
  storageBucket: "chatzone-66bca.appspot.com",
  messagingSenderId: "152431931828",
  appId: "1:152431931828:web:1d749904e08efb7a5482e1",
  measurementId: "G-QESTTRBWQM"
};

try {
  firebase.initializeApp(firebaseConfig);
} catch (err) { }

export default function LoginScreen({ navigation }) {
  const [phoneClick, setPhoneClick] = React.useState(false);
  const [emailClick, setEmailClick] = React.useState(false);
  const [registerClick, setRegisterClick] = React.useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [image, setImage] = useState(null);

  const onBackPress = () => {
    setPhoneClick(false);
    setEmailClick(false);
    setPhoneNumber('');
    setVerificationId('');
    setVerificationCode('');
  };

  const [token, setToken] = useState("");
  const [userInfo, setUserInfo] = useState(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: "",
    androidClientId: "152431931828-7dsl9j10233gmv8mmhjs2nnouj77m56v.apps.googleusercontent.com",
  });

  useEffect(() => {
    if (response?.type === "success") {
      setToken(response.authentication.accessToken);
      getUserInfo();
    }
  }, [response, token]);

  const getUserInfo = async () => {
    try {
      const response = await fetch(
        "https://www.googleapis.com/userinfo/v2/me",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const user = await response.json();
      setUserInfo(user);
    } catch (error) {
      // Add your own error handler here
    }
  };

  const app = getApp();
  const auth = getAuth();
  const recaptchaVerifier = React.useRef(null);
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [verificationId, setVerificationId] = React.useState('');
  const [verificationCode, setVerificationCode] = React.useState('');
  const [message, showMessage] = React.useState();
  const firebaseConfig = app ? app.options : undefined;
  const attemptInvisibleVerification = false;

  // Sends verification code to phone number
  const sendVerificationCode = async () => {
    try {
      const phoneProvider = new PhoneAuthProvider(auth);
      const verificationId = await phoneProvider.verifyPhoneNumber(
        phoneNumber,
        recaptchaVerifier.current
      );
      setVerificationId(verificationId);
      showMessage({
        text: 'Verification code has been sent to your phone.',
        color: 'green'
      });
    } catch (err) {
      if (err.code == "auth/invalid-phone-number") {
        showMessage({ text: "Invalid phone number format. Ex(+66________)", color: 'red' })
      } else {
        showMessage({ text: `Error: ${err.message}`, color: 'red' });
      }
    }
  };

  // Verifies verification code and signs in user
  const verifyCodeAndSignIn = async () => {
    try {
      const credential = PhoneAuthProvider.credential(
        verificationId,
        verificationCode
      );
      await signInWithCredential(auth, credential);
      showMessage({ text: 'Phone authentication successful 👍', color: 'green' });
    } catch (err) {
      showMessage({ text: `Error: ${err.message}`, color: 'red' });
    }
  };

  const signInWithEmail = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password).then((userCredential) => {
        const db = getDatabase();
        const userID = userCredential.user.uid
        const updateRef = ref(db, 'users/' + userID);
        update(updateRef, { email: email, password: password }).then(() => {
          console.log('Data updated successfully!');
        })
          .catch((error) => {
            console.error('Error updating data:', error);
          });
      });
    } catch (error) {
      console.error(error);
      if (error.code == "auth/invalid-email" || error.code == "auth/missing-password") {
        showMessage({ text: "* Email and password are required", color: 'red' });
      } else if (error.code == "auth/wrong-password") {
        showMessage({ text: "* Invalid password", color: 'red' });
      } else {
        showMessage({ text: "* Unknow email, Please register", color: 'red' });
      }
      // แสดง error หรือทำตามต้องการ เช่นแสดง message ให้ผู้ใช้รู้ว่าเกิด error อะไร
    }
  };

  const register = () => {
    const database = getDatabase()
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // User registered successfully
        const userID = userCredential.user.uid
        set(ref(database, 'users/' + userID), {
          email: email,
          image: image,
          password: password,
          phoneNumber: phoneNumber,
          username: name
        });

        Alert.alert('Register Success');
        setRegisterClick(false);
      })
      .catch((error) => {
        Alert.alert('Register status', error.code, [{ text: 'OK', textAlign: 'center' }]);
      });
  };

  const forgotPassword = () => {
    sendPasswordResetEmail(auth, email)
      .then(() => {
        showMessage({ text: 'Password reset email sent successfully', color: 'green' });
      })
      .catch((error) => {
        showMessage({ text: error.code, color: 'red' });
      });
  };

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
      if (!result.canceled) {
        setImage(result.uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load image from library', [{ text: 'OK', textAlign: 'center' }]);
      console.log(error);
    }
  };


  if (phoneClick) {
    return (
      <View style={styles2.container}>
        <TouchableOpacity onPress={onBackPress} style={styles2.backButton}>
          <Image source={require('../assets/arrow_back.png')} style={styles2.backButtonIcon}></Image>
        </TouchableOpacity>
        <Text style={styles2.title}>Phone Sign In</Text>
        <View style={styles2.inputContainer}>
          <Text style={styles2.inputLabel}>Enter your phone number</Text>
          <TextInput
            style={styles2.input}
            placeholder="+66 999 999 9999"
            autoFocus
            autoCompleteType="tel"
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            onChangeText={(phoneNumber) => setPhoneNumber(phoneNumber)}
          />
          <TouchableOpacity style={styles2.button} onPress={sendVerificationCode}>
            <Text style={styles2.buttonText}>Send Verification Code</Text>
          </TouchableOpacity>
          <Text style={styles2.inputLabel}>Enter Verification Code</Text>
          <TextInput
            style={styles2.input}
            editable={!!verificationId}
            placeholder="123456"
            onChangeText={setVerificationCode}
          />
          <TouchableOpacity
            style={[styles2.button, styles2.confirmButton]}
            onPress={verifyCodeAndSignIn}
          >
            <Text style={[styles2.buttonText, styles2.confirmButtonText]}>Confirm Verification Code</Text>
          </TouchableOpacity>
        </View>
        {message && (
          <TouchableOpacity
            style={styles2.messageBox}
            onPress={() => showMessage(undefined)}
          >
            <Text
              style={[
                styles2.messageText,
                { color: message.color || 'blue' },
              ]}
            >
              {message.text}
            </Text>
          </TouchableOpacity>
        )}
        <View>
          <FirebaseRecaptchaVerifierModal style={styles2.recaptchaContainer}
            ref={recaptchaVerifier}
            firebaseConfig={app.options}
          />
          {attemptInvisibleVerification && <FirebaseRecaptchaBanner />}
        </View>
      </View>
    );
  }
  else if (emailClick) {
    if (registerClick) {
      return (
        <ScrollView contentContainerStyle={styles2.Scrollcontainer}>
          <TouchableOpacity onPress={() => setRegisterClick(false)} style={styles2.backButton}>
            <Image source={require('../assets/arrow_back.png')} style={styles2.backButtonIcon} />
          </TouchableOpacity>
          <Text style={styles2.title}>Create an account</Text>
          <View style={styles2.inputContainer}>
            <TouchableOpacity style={styles2.avatar} onPress={pickImage}>
              {image ? (
                <Image source={{ uri: image }} style={styles2.avatarImage} />
              ) : (
                <Image
                  source={require('../assets/icon.png')}
                  style={styles2.avatarIcon}
                />
              )}
            </TouchableOpacity>
            <Text style={styles2.inputLabel}>Name</Text>
            <TextInput
              style={styles2.input}
              autoFocus
              placeholder='Your nick name'
              keyboardType="default"
              textContentType="nickname"
              onChangeText={(name) => setName(name)}
            />
            <Text style={styles2.inputLabel}>Phone number</Text>
            <TextInput
              style={styles2.input}
              placeholder="+66_________"
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              onChangeText={(phoneNumber) => setPhoneNumber(phoneNumber)}
            />
            <Text style={styles2.inputLabel}>Email address</Text>
            <TextInput
              style={styles2.input}
              placeholder="example@domain.com"
              autoCompleteType="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              onChangeText={(email) => setEmail(email)}
            />
            <Text style={styles2.inputLabel}>Password</Text>
            <TextInput
              style={styles2.input}
              placeholder="•••••••••••"
              secureTextEntry
              autoCompleteType="password"
              textContentType="password"
              onChangeText={(password) => setPassword(password)}
            />
          </View>
          <TouchableOpacity style={[styles2.button, styles2.confirmButton]}><Text style={[styles2.buttonText, styles2.confirmButtonText]} onPress={register}>Sign up</Text></TouchableOpacity>
        </ScrollView>
      );
    }
    return (
      <ScrollView contentContainerStyle={styles2.Scrollcontainer}>
        <TouchableOpacity onPress={onBackPress} style={styles2.backButton}>
          <Image source={require('../assets/arrow_back.png')} style={styles2.backButtonIcon} />
        </TouchableOpacity>
        <Text style={styles2.title}>Sign In</Text>
        <View style={styles2.inputContainer}>
          <Text style={styles2.inputLabel}>Email address</Text>
          <TextInput
            style={styles2.input}
            placeholder="example@domain.com"
            autoFocus
            autoCompleteType="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            onChangeText={(email) => setEmail(email)}
          />
          <Text style={styles2.inputLabel}>Password</Text>
          <TextInput
            style={styles2.input}
            placeholder="•••••••••••"
            secureTextEntry
            autoCompleteType="password"
            textContentType="password"
            onChangeText={(password) => setPassword(password)}
          />
        </View>
        <TouchableOpacity onPress={forgotPassword}><Text style={[styles2.textLink, { marginBottom: 20, }]}>Forgot Password?</Text></TouchableOpacity>
        <TouchableOpacity style={[styles2.button, styles2.confirmButton]} onPress={signInWithEmail}>
          <Text style={[styles2.buttonText, styles2.confirmButtonText]}>Sign In</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setRegisterClick(true)}><Text style={styles2.textLink}>Don't have an account?</Text></TouchableOpacity>
        {message && (
          <TouchableOpacity style={{ margin: 10 }} onPress={() => showMessage(undefined)}>
            <Text style={[styles2.messageText, { color: message.color || 'blue' }]}>{message.text}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#87ceeb', '#6495ed']} style={styles.gradient}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>ChatZone</Text>
          <Image source={require('../assets/ChatZone.png')} style={styles.appIcon}></Image>
        </View>
        <View style={styles.signInOptionsContainer}>
          <Text style={styles.signInHeader}>Sign In Options</Text>
          <TouchableOpacity style={styles.signInButtonContainer} onPress={() => setPhoneClick(true)}>
            <View style={styles.iconContainer}>
              <Icon name="phone" size={25} color="green" />
            </View>
            <Text style={styles.signInButtonText}>Sign In with Phone Number</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.signInButtonContainer} onPress={() => setEmailClick(true)}>
            <View style={styles.iconContainer}>
              <Icon name="email" size={25} color={"skyblue"} />
            </View>
            <Text style={styles.signInButtonText}>Sign In with Email</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.signInButtonContainer} disabled={!request} onPress={() => { promptAsync(); }}>
            <View style={styles.iconContainer}>
              <FontAwesome name="google" size={25} color="#DB4437" />
            </View>
            <Text style={styles.signInButtonText}>Sign In with Google</Text>
          </TouchableOpacity>
          <Text style={styles.footer}>By signing in, you agree to our Terms and Privacy Policy</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 50,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#ffffff',
    marginTop: '30%',
  },
  signInOptionsContainer: {
    flex: 2,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInHeader: {
    fontSize: 25,
    color: '#ffffff',
    marginBottom: 20,
  },
  iconContainer: {
    marginRight: 10,
  },
  appIcon: {
    width: 400,
    height: 200,
    resizeMode: 'cover',
  },
  signInButtonContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 10,
    width: '100%',
    marginStart: '40%',
    marginBottom: 15,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  signInButtonText: {
    fontSize: 18,
  },
  footer: {
    fontSize: 12,
    marginTop: 30,
    textAlign: 'center',
    color: '#ffffff',
  },
});

const styles2 = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 50,
    backgroundColor: '#6495ed',
    alignItems: 'center',
  },
  Scrollcontainer: {
    flexGrow: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
    backgroundColor: '#6495ed',
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  textLink: {
    fontSize: 16,
    color: 'white'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: 20,
    alignSelf: 'center',
    color: 'white',
    marginBottom: 50,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    color: 'white',
  },
  input: {
    width: '100%',
    height: 48,
    backgroundColor: '#fafafa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  inputContainer: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
  },
  button: {
    width: '100%',
    backgroundColor: '#32a1f2',
    borderRadius: 10,
    marginBottom: 10,
    padding: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#28a745',
  },
  confirmButtonText: {
    color: '#fff',
  },
  messageBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  messageText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
  },
  messageTextSuccess: {
    color: 'green',
  },
  messageTextError: {
    color: 'red',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 5,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  backButtonIcon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  recaptchaContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E5E5',
    borderRadius: 100,
    width: 220,
    height: 220,
  },
  avatar: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarIcon: {
    width: 200,
    height: 200,
    borderRadius: 100,
    resizeMode: 'cover',
  },
});
