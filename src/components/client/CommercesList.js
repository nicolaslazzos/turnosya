import React, { Component } from 'react';
import { View } from 'react-native';
import { connect } from 'react-redux';
import { InstantSearch, Configure } from 'react-instantsearch/native';
import { IconButton } from '../common';
import getEnvVars from '../../../environment';
import ConnectedHits from './CommercesList.SearchHits';
import ConnectedSearchBox from './CommercesList.SearchBox';
import ConnectedStateResults from './CommercesList.StateResults';
import { readFavoriteCommerces } from '../../actions';

const { appId, searchApiKey, commercesIndex } = getEnvVars().algoliaConfig;

class CommercesList extends Component {
  state = {
    areaName: this.props.navigation.state.params.areaName, // Mover esto a Redux
    searchVisible: false
  };

  componentDidMount() {
    this.props.navigation.setParams({
      rightIcons: this.renderRightButtons(),
      header: undefined
    });
    
    this.props.readFavoriteCommerces();
  }

  static navigationOptions = ({ navigation }) => {
    return {
      headerTitle: 'Buscar negocios',
      headerRight: navigation.getParam('rightIcons'),
      header: navigation.getParam('header')
    };
  };

  renderRightButtons = () => {
    return (
      <View style={{ flexDirection: 'row', alignSelf: 'stretch' }}>
        <IconButton icon="md-search" containerStyle={{ paddingRight: 0 }} onPress={this.onSearchPress} />
        <IconButton icon="ios-funnel" onPress={this.onFiltersPress} />
      </View>
    );
  };

  onSearchPress = async () => {
    this.props.navigation.setParams({ header: null });
    this.setState({ searchVisible: true });
  };

  onFiltersPress = () => {
    this.props.navigation.navigate('commercesFiltersScreen');
  };

  onCancelPress = () => {
    this.props.navigation.setParams({ header: undefined });
    this.setState({ searchVisible: false });
  };

  renderAlgoliaSearchBar = () => {
    if (this.state.searchVisible) {
      return (
        <ConnectedSearchBox
          autoFocus={true}
          showLoadingIndicator
          onCancel={this.onCancelPress}
        />
      );
    }
  };

  obtainFacetProps = () => {
    if (this.state.areaName && this.props.provinceNameFilter)
      return {
        filters: `areaName:\'${this.state.areaName}\' AND provinceName:\'${this.props.provinceNameFilter}\'`
      };
    else if (this.state.areaName)
      return { filters: `areaName:\'${this.state.areaName}\'` };
    else if (this.props.provinceNameFilter)
      return { filters: `provinceName:\'${this.props.provinceNameFilter}\'` };
    else return null;
  };

  obtainGeolocationProps = () => {
    return this.props.locationEnabled
      ? {
        aroundLatLng: `${this.props.latitude}, ${this.props.longitude}`,
        aroundRadius: Math.round(1000 * this.props.locationRadiusKms)
      }
      : null;
  };

  render() {
    return (
      <InstantSearch
        appId={appId}
        apiKey={searchApiKey}
        indexName={commercesIndex}
        stalledSearchDelay={0}
        root={{
          Root: View, // component to render as the root of InstantSearch
          props: { style: { flex: 1 } } // props that will be applied on the root component aka View
        }}
      >
        {this.renderAlgoliaSearchBar()}
        <Configure
          {...{ ...this.obtainFacetProps(), ...this.obtainGeolocationProps() }}
        />
        <ConnectedStateResults />
        <ConnectedHits />
      </InstantSearch>
    );
  }
}

const mapStateToProps = state => {
  const {
    refinement,
    favoriteCommerces,
    provinceNameFilter,
    locationEnabled,
    locationRadiusKms
  } = state.commercesList;
  const { latitude, longitude } = state.locationData;

  return {
    refinement,
    favoriteCommerces,
    provinceNameFilter,
    locationEnabled,
    locationRadiusKms,
    latitude,
    longitude
  };
};

export default connect(
  mapStateToProps,
  { readFavoriteCommerces }
)(CommercesList);
