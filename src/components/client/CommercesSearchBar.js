import React, { Component } from 'react';
import { View, StyleSheet } from 'react-native';
import { SearchBar } from 'react-native-elements';
import Constants from 'expo-constants';
import { MAIN_COLOR, NAVIGATION_HEIGHT } from '../../constants';

class CommercesSearchBar extends Component {
  render() {
    return (
      <View style={styles.mainContainer}>
        <SearchBar
          {...this.props}
          platform="android"
          placeholder="Buscar negocios..."
          onCancel={this.props.onCancel}
          containerStyle={styles.searchBarContainer}
          inputStyle={{ marginTop: 1, marginLeft: 12, marginRight: 0 }}
          searchIcon={{ color: MAIN_COLOR }}
          cancelIcon={{ color: MAIN_COLOR }}
          clearIcon={{ color: MAIN_COLOR }}
          loadingProps={{ color: MAIN_COLOR }}
          selectionColor={MAIN_COLOR}
          showLoading={this.props.searching}
        />
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

export default CommercesSearchBar;
