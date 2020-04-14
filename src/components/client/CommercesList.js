import React, { Component } from 'react';
import { View, FlatList } from 'react-native';
import { connect } from 'react-redux';
import { Fab } from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { MAIN_COLOR } from '../../constants';
import { IconButton, EmptyList, Spinner } from '../common';
import CommerceListItem from './CommerceListItem';
import CommercesSearchBar from './CommercesSearchBar';
import { onFavoriteCommercesRead, onCommercesListValueChange, onSelectedLocationChange, onCommercesRead } from '../../actions';

class CommercesList extends Component {
  state = { areaId: this.props.navigation.getParam('areaId'), searchVisible: false, search: '' };

  static navigationOptions = ({ navigation }) => {
    return {
      headerRight: (
        <View style={{ flexDirection: 'row', alignSelf: 'stretch' }}>
          <IconButton
            icon="md-search"
            containerStyle={{ paddingRight: 0 }}
            onPress={navigation.getParam('onSearchPress')}
          />
          <IconButton icon="ios-funnel" onPress={navigation.getParam('onFiltersPress')} />
        </View>
      ),
      header: navigation.getParam('header')
    };
  };

  componentDidMount() {
    this.props.navigation.setParams({
      onSearchPress: this.onSearchPress,
      onFiltersPress: this.onFiltersPress,
      header: undefined
    });

    this.props.onCommercesRead({ areaId: this.state.areaId });

    this.props.onFavoriteCommercesRead();

    if (!this.props.provinceNameFilter) {
      this.props.onCommercesListValueChange({ provinceNameFilter: this.props.clientProvinceName });
    }
  }

  componentWillUnmount() {
    this.onFiltersClear();
  }

  onFiltersClear = () => {
    this.props.onCommercesListValueChange({
      locationButtonIndex: 0,
      provinceNameFilter: this.props.clientProvinceName ? this.props.clientProvinceName : ''
    });

    this.props.onSelectedLocationChange();
  };

  onSearchPress = () => {
    this.props.navigation.setParams({ header: null });
    this.setState({ searchVisible: true });
  };

  onChangeText = text => {
    this.props.onCommercesRead({ contains: text, areaId: this.state.areaId })
    this.setState({ search: text });
  }

  onFiltersPress = () => {
    this.props.navigation.navigate('commercesFiltersScreen');
  };

  onCancelPress = () => {
    this.props.navigation.setParams({ header: undefined });
    this.setState({ searchVisible: false });
  };

  renderSearchBar = () => {
    if (this.state.searchVisible) {
      return (
        <CommercesSearchBar
          onChangeText={this.onChangeText}
          value={this.state.search}
          onCancel={this.onCancelPress}
          autoFocus={true}
          showLoadingIndicator
        />
      );
    }
  };

  onMapFabPress = () => {
    this.props.navigation.navigate('commercesListMap');
  };

  renderItem({ item }) {
    return <CommerceListItem commerce={item} />;
  }

  renderList() {
    if (this.props.searching) return <Spinner />;

    if (this.props.commerces.length) {
      return (
        <FlatList
          data={this.props.commerces}
          renderItem={this.renderItem}
          keyExtractor={commerce => commerce.commerceId.toString()}
          initialNumToRender={20}
          contentContainerStyle={{ paddingBottom: 95 }}
        />
      )
    }

    return <EmptyList title="No se encontraron negocios" />;
  }

  render() {
    return (
      <View style={{ flex: 1 }}>
        {this.renderSearchBar()}
        {this.renderList()}
        <Fab style={{ backgroundColor: MAIN_COLOR }} position="bottomRight" onPress={this.onMapFabPress}>
          <Ionicons name="md-compass" />
        </Fab>
      </View>
    );
  }
}

const mapStateToProps = state => {
  const { refinement, favoriteCommerces, provinceNameFilter, locationRadiusKms, searching, commerces } = state.commercesList;
  const { address, city, provinceName, country, latitude, longitude, selectedLocation } = state.locationData;

  return {
    commerces,
    searching,
    refinement,
    favoriteCommerces,
    provinceNameFilter,
    locationRadiusKms,
    address,
    city,
    provinceName,
    country,
    latitude,
    longitude,
    selectedLocation,
    clientProvinceName: state.clientData.province.name
  };
};

export default connect(mapStateToProps, {
  onFavoriteCommercesRead,
  onCommercesListValueChange,
  onSelectedLocationChange,
  onCommercesRead
})(CommercesList);
