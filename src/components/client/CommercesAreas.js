import React, { Component } from 'react';
import { FlatList, View, Text, TouchableOpacity } from 'react-native';
import { connect } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { Spinner } from '../common';
import { onAreasRead } from '../../actions';
import CommercesAreaItem from './CommercesAreaItem';

class CommercesAreas extends Component {
  static navigationOptions = ({ navigation }) => {
    return {
      headerRight:
        <TouchableOpacity
          onPress={() => navigation.navigate('commercesList', { areaId: '' })}
          activeOpacity={0.5}
          style={{ backgorundColor: 'transparent' }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text
              style={{
                color: 'white',
                marginRight: 5,
                textAlign: 'center',
                alignSelf: 'center',
                paddingRight: 2
              }}
            >
              Ver todos
          </Text>
            <Ionicons name="md-arrow-forward" size={24} color="white" style={{ marginRight: 15 }} />
          </View>
        </TouchableOpacity>
    };
  };

  componentDidMount() {
    this.props.onAreasRead();
  }

  renderRow = ({ item }) => {
    return <CommercesAreaItem area={item} navigation={this.props.navigation} />;
  };

  render() {
    if (this.props.loading) {
      return <Spinner />;
    }
    return (
      <View style={{ flex: 1 }}>
        <FlatList data={this.props.areas} renderItem={this.renderRow} keyExtractor={area => area.areaId} />
      </View>
    );
  }
}

const mapStateToProps = state => {
  const { areas, loading } = state.commercesList;
  return { areas, loading };
};

export default connect(mapStateToProps, { onAreasRead })(CommercesAreas);
