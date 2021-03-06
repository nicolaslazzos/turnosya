import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { FlatList, View, StyleSheet } from 'react-native';
import { Fab } from 'native-base';
import { Spinner, EmptyList, IconButton } from '../common';
import ServicesListItem from './ServicesListItem';
import { onFormOpen } from '../../actions';
import { MAIN_COLOR, NAVIGATION_HEIGHT } from '../../constants';
import { SearchBar } from 'react-native-elements';
import Constants from 'expo-constants';

class ServicesList extends Component {
  state = { search: '', searchVisible: false };

  componentDidMount() {
    this.props.navigation.setParams({
      onSearchPress: this.onSearchPress,
      header: undefined
    });
  }

  static navigationOptions = ({ navigation }) => {
    return {
      headerRight: <IconButton icon="md-search" onPress={navigation.getParam('onSearchPress')} />,
      header: navigation.getParam('header')
    };
  };

  onSearchPress = () => {
    this.props.navigation.setParams({ header: null });
    this.setState({ searchVisible: true });
  };

  onCancelPress = () => {
    this.props.navigation.setParams({ header: undefined });
    this.setState({ searchVisible: false, search: '' });
  };

  renderRow({ item }) {
    return (
      <ServicesListItem
        service={item}
        commerceId={this.props.commerceId}
        navigation={this.props.navigation}
        employeeId={this.props.employeeId}
      />
    );
  }

  onAddPress = () => {
    this.props.onFormOpen();
    this.props.navigation.navigate('serviceForm');
  };

  renderAddButton = () => {
    return (
      <Fab style={{ backgroundColor: MAIN_COLOR }} position="bottomRight" onPress={() => this.onAddPress()}>
        <Ionicons name="md-add" />
      </Fab>
    );
  };

  renderList = () => {
    if (this.props.services.length) {
      return (
        <FlatList
          data={this.servicesFilter()}
          renderItem={this.renderRow.bind(this)}
          keyExtractor={service => service.id}
          contentContainerStyle={{ paddingBottom: 95 }}
        />
      );
    }

    return <EmptyList title="No hay ningún servicio" />;
  };

  servicesFilter() {
    return this.props.services.filter(service =>
      service.name
        .toLowerCase()
        .trim()
        .includes(this.state.search.toLowerCase().trim())
    );
  }

  renderSearchBar = () => {
    if (this.state.searchVisible) {
      return (
        <View style={styles.mainContainer}>
          <SearchBar
            placeholder="Buscar servicios.."
            value={this.state.search}
            onChangeText={text => this.setState({ search: text })}
            platform="android"
            containerStyle={styles.searchBarContainer}
            inputStyle={{ marginTop: 1, marginLeft: 12, marginRight: 0 }}
            onCancel={() => this.onCancelPress()}
            searchIcon={{ color: MAIN_COLOR }}
            cancelIcon={{ color: MAIN_COLOR }}
            clearIcon={{ color: MAIN_COLOR }}
            loadingProps={{ color: MAIN_COLOR }}
            selectionColor={MAIN_COLOR}
            autoFocus
          />
        </View>
      );
    }
  };
  render() {
    if (this.props.loading) {
      return <Spinner />;
    }

    return (
      <View style={{ flex: 1 }}>
        {this.renderSearchBar()}
        {this.renderList()}

        <Fab style={{ backgroundColor: MAIN_COLOR }} position="bottomRight" onPress={() => this.onAddPress()}>
          <Ionicons name="md-add" />
        </Fab>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  mainContainer: {
    height: NAVIGATION_HEIGHT + Constants.statusBarHeight,
    alignSelf: 'stretch',
    justifyContent: 'flex-end',
    backgroundColor: MAIN_COLOR,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2
  },
  searchBarContainer: {
    alignSelf: 'stretch',
    height: NAVIGATION_HEIGHT,
    paddingTop: 4,
    paddingRight: 5,
    paddingLeft: 5,
    marginTop: Constants.statusBarHeight
  }
});

const mapStateToProps = state => {
  const { services, loading } = state.servicesList;
  const { commerceId } = state.commerceData;
  const { employeeId } = state.roleData;

  return { services, loading, commerceId, employeeId };
};

export default connect(mapStateToProps, { onFormOpen })(ServicesList);
