import { StyleSheet, Dimensions } from 'react-native';

const screenHeight = Dimensions.get('window').height;
const ingredientImageMaxHeight = screenHeight * 0.20;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    justifyContent: "center",
  },
  headerTitleContainer: {
    alignItems: "center",
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 48,
    fontWeight: "bold",
    textAlign: "center",
  },
  nextButton: {
    alignSelf: "flex-end",
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 999,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  nextButtonDisabled: {
    backgroundColor: "#cccccc",
  },
  nextButtonText: {
    color: "white",
    fontSize: 50,
    fontWeight: "bold",
    marginRight: 8,
  },
  middleSection: {
    flex: 1,
    backgroundColor: "#F44336",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  column: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  ingredientImage: {
    width: 300,
    height: 300,
    margin: 12,
    marginTop: 20,
    maxHeight: ingredientImageMaxHeight,
    resizeMode: 'contain',
  },
  addMoreText: {
    color: "white",
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 10,
  },
  bottomSection: {
    backgroundColor: "white",
    padding: 0,
    alignItems: "flex-end",
  },
  confirmationDialog: {
    maxWidth: 350,
    alignSelf: "center",
  },
  dialogButton: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  columnsContainer: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'flex-start',
  }
});

export default styles;
