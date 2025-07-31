import React, { useState } from 'react';
import { View, TextInput, Button } from 'react-native';

function SendMessageInput({ onSendMessage }) {
    const [message, setMessage] = useState('');

    const handleSendMessage = () => {
        if (message) {
            onSendMessage(message);
            setMessage('');
        }
    };

    return (
        <View style={{ flexDirection: 'row' }}>
            <TextInput
                style={{ flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10 }}
                value={message}
                onChangeText={setMessage}
                placeholder="Type a message..."
            />
            <Button title="Send" onPress={handleSendMessage} />
        </View>
    );
}

export default SendMessageInput;
