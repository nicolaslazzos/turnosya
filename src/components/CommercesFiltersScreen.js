import React, { Component } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Divider, Button } from 'react-native-elements';
import { connect } from 'react-redux';
import { IconButton, Picker } from './common';
import { MAIN_COLOR } from '../constants';
import { onProvincesRead } from '../actions';
import { Ionicons } from '@expo/vector-icons';

class CommerceFiltersScreen extends Component {
  constructor(props) {
    super(props);

    props.onProvincesRead();

    this.state = { province: '' };
  }

  onApplyFiltersPress = () => {
    console.log(this.state.province);
    this.props.navigation.state.params.returnData(this.state.province);
    this.props.navigation.goBack();
  };

  render() {
    return (
      <View style={{ flex: 1, backgroundColor: MAIN_COLOR }}>
        <View
          style={{
            paddingTop: 20,
            height: 70,
            alignItems: 'center',
            justifyContent: 'space-between',
            flexDirection: 'row'
          }}
        >
          <IconButton
            icon="md-close"
            onPress={() => this.props.navigation.goBack()}
          />
          <Button
            title="Aplicar Filtros"
            type="clear"
            titleStyle={{ color: 'white' }}
            onPress={this.onApplyFiltersPress}
            style={{ marginRight: 10, padding: 5 }}
          />
        </View>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
            <Divider
              style={{
                backgroundColor: 'white',
                flex: 1,
                alignSelf: 'center',
                marginHorizontal: 5
              }}
            />
            <Text style={{ color: 'white', padding: 5 }}>Provincia</Text>
            <Divider
              style={{
                backgroundColor: 'white',
                flex: 1,
                alignSelf: 'center',
                marginHorizontal: 5
              }}
            />
          </View>

          <View
            style={{
              alignSelf: 'stretch',
              paddingBottom: 20,
              paddingHorizontal: 10
            }}
          >
            <Picker
              placeholder={{ value: null, label: 'Todas' }}
              value={this.state.province}
              items={this.props.provincesList}
              onValueChange={value => this.setState({ province: value })}
              color="white"
              textColor="white"
            />
          </View>
        </View>
      </View>
    );
  }
}

const mapStateToProps = state => {
  const { provincesList } = state.provinceData;

  return { provincesList };
};

export default connect(
  mapStateToProps,
  { onProvincesRead }
)(CommerceFiltersScreen);
