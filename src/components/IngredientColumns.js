import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Divider } from 'react-native-paper';
import ScaleDisplayComponent from './ScaleDisplayComponent';
import MockScaleComponent from './MockScaleComponent';

const IngredientColumns = ({
  ingredient,
  currentWeight,
  onWeightChange,
  onTare,
  requireScale,
  styles,
  isMockScaleActive,
}) => {
  const isWeighable = ingredient.stepType === 'weighable';
  const isWeightBased = ingredient.stepType === 'weight';

  return (
    <View style={styles.columnsContainer}>
      {/* Middle Column */}
      <View style={styles.column}>
        {isWeightBased && (
          <>
            <ScaleDisplayComponent
              targetIngredient={ingredient}
              currentWeight={currentWeight}
              onWeightChange={onWeightChange}
              onTare={onTare}
              requireTare={ingredient.requireTare}
            />
            <Divider style={{ height: 1, backgroundColor: 'black' }} />
            <Text style={styles.addMoreText}></Text>
            <Divider style={{ height: 1, backgroundColor: 'black' }} />
          </>
        )}
        {isWeighable && (
          <ScaleDisplayComponent
            targetIngredient={ingredient}
            currentWeight={currentWeight}
            onWeightChange={onWeightChange}
            onTare={onTare}
            requireTare={false}
            isWeighableOnly={true}
          />
        )}
      </View>
       {/* Right Column */}
    {requireScale && isMockScaleActive && (
    <View style={styles.column}>
       <MockScaleComponent />
    </View>
    )}
  </View>
);
}

export default IngredientColumns;
