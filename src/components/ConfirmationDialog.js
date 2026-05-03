import React from 'react';
import { View } from 'react-native';
import { Dialog, Portal, Button, Paragraph } from 'react-native-paper';
import styles from '../screens/IngredientScreen.styles';

const ConfirmationDialog = ({ visible, ingredientName, onDismiss, onConfirm }) => {
  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onDismiss}
        style={styles.confirmationDialog}
      >
        <Dialog.Title>Confirm {ingredientName}</Dialog.Title>
        <Dialog.Content>
          <Paragraph>Have you completed this step?</Paragraph>
        </Dialog.Content>
        <Dialog.Actions>
          <Button
            mode="contained"
            buttonColor="red"
            onPress={onDismiss}
            style={styles.dialogButton}
          >
            No
          </Button>
          <Button
            mode="contained"
            buttonColor="green"
            onPress={onConfirm}
            style={styles.dialogButton}
          >
            Yes
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

export default ConfirmationDialog;
