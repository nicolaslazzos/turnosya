import React, { Component } from 'react';
import { View, Text, TouchableHighlight } from 'react-native';
import { Card } from 'react-native-elements';

class CommercesAreaItem extends Component {
  onAreaPress(areaId) {
    this.props.navigation.navigate('commercesList', { areaId });
  }

  render() {
    const { name, image, areaId } = this.props.area;

    return (
      <View>
        <TouchableHighlight onPress={() => this.onAreaPress(areaId)} underlayColor="transparent">
          <Card
            image={(source = image ? { uri: image } : null)}
            containerStyle={{ borderRadius: 10, overflow: 'hidden' }}
          >
            <Text
              style={{
                fontSize: 16,
                textAlign: 'center'
              }}
            >
              {name}
            </Text>
          </Card>
        </TouchableHighlight>
      </View>
    );
  }
}

export default CommercesAreaItem;
