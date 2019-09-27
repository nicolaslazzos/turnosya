import React from 'react';
import {
  ActivityIndicator,
  Text,
  Button,
  Platform,
  StyleSheet,
  View,
  TouchableHighlight
} from 'react-native';
import MapView from 'react-native-maps';
import * as Permissions from 'expo-permissions';
import * as Location from 'expo-location';

const EXAMPLES = [
  { latitude: 49.28, longitude: -123.12 },
  { latitude: -31.4250866, longitude: -64.1836257 },
  'Palo Alto Caltrain Station (this one will error)',
  'Chacabuco 847, Nueva Córdoba, Córdoba, Argentina'
];

export default class GeocodingScreen extends React.Component {
  static navigationOptions = {
    title: 'Geocoding'
  };

  state = {
    selectedExample: EXAMPLES[0],
    result: '',
    inProgress: false
  };

  componentDidMount() {
    Permissions.askAsync(Permissions.LOCATION);
  }

  getMyLocation = async () => {
    this.setState({ location: await Location.getCurrentPositionAsync({}) });
  };

  map = () => {
    return (
      <MapView
        style={{ flex: 1, margin: 15 }}
        initialRegion={{
          latitude: -31.4250866,
          longitude: -64.1836257,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421
        }}
        onLongPress={e => alert(e.nativeEvent.coordinate.longitude)}
      />
    );
  };

  render() {
    let { selectedExample } = this.state;

    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>Select a location</Text>
        </View>

        <View style={styles.examplesContainer}>
          {EXAMPLES.map(this._renderExample)}
        </View>

        <View style={styles.separator} />

        <View style={styles.actionContainer}>
          <Button
            onPress={this._attemptGeocodeAsync}
            title="Geocode"
            disabled={typeof selectedExample !== 'string'}
            style={styles.button}
          />
          <Button
            onPress={this._attemptReverseGeocodeAsync}
            title="Reverse Geocode"
            disabled={typeof selectedExample !== 'object'}
            style={styles.button}
          />
          <Button
            onPress={() => this.getMyLocation()}
            title="Mi location"
            style={styles.button}
          />
        </View>

        <View style={styles.separator} />

        {this._maybeRenderResult()}
        {this.map()}
      </View>
    );
  }

  _attemptReverseGeocodeAsync = async () => {
    this.setState({ inProgress: true });
    try {
      let result = await Location.reverseGeocodeAsync(
        this.state.selectedExample
      );
      this.setState({ result });
    } catch (e) {
      this.setState({ error: e });
    } finally {
      this.setState({ inProgress: false });
    }
  };

  _attemptGeocodeAsync = async () => {
    this.setState({ inProgress: true, error: null });
    try {
      let result = await Location.geocodeAsync(this.state.selectedExample);
      this.setState({ result });
    } catch (e) {
      this.setState({ error: e.message });
    } finally {
      this.setState({ inProgress: false });
    }
  };

  _maybeRenderResult = () => {
    let { selectedExample } = this.state;
    let text =
      typeof selectedExample === 'string'
        ? selectedExample
        : JSON.stringify(selectedExample);

    if (this.state.inProgress) {
      return <ActivityIndicator style={{ marginTop: 10 }} />;
    } else if (this.state.result) {
      return (
        <Text style={styles.resultText}>
          {text} resolves to {JSON.stringify(this.state.result)}
        </Text>
      );
    } else if (this.state.error) {
      return (
        <Text style={styles.errorResultText}>
          {text} cannot resolve: {JSON.stringify(this.state.error)}
        </Text>
      );
    }
  };

  _renderExample = (example, i) => {
    let { selectedExample } = this.state;
    let isSelected = selectedExample === example;
    let text = typeof example === 'string' ? example : JSON.stringify(example);

    return (
      <TouchableHighlight
        key={i}
        hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}
        onPress={() => this._selectExample(example)}
      >
        <Text
          style={[styles.exampleText, isSelected && styles.selectedExampleText]}
        >
          {text}
        </Text>
      </TouchableHighlight>
    );
  };

  _selectExample = example => {
    if (this.state.inProgress) {
      return;
    }

    this.setState({ selectedExample: example, result: '', error: '' });
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginTop: 10,
    marginBottom: 5
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5
  },
  headerContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginHorizontal: 20,
    marginBottom: 0,
    marginTop: 20
  },
  exampleText: {
    fontSize: 15,
    color: '#ccc',
    marginVertical: 10
  },
  examplesContainer: {
    paddingTop: 15,
    paddingBottom: 5,
    paddingHorizontal: 20
  },
  selectedExampleText: {
    color: 'black'
  },
  resultText: {
    padding: 20
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10
  },
  errorResultText: {
    padding: 20,
    color: 'red'
  },
  button: {
    ...Platform.select({
      android: {
        marginBottom: 10
      }
    })
  },
  map: {
    ...StyleSheet.absoluteFillObject
  }
});
