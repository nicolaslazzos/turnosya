import React, { Component } from 'react';
import { ScrollView, Dimensions } from 'react-native';
import { connect } from 'react-redux';
import moment from 'moment';
import { BarChart, Spinner, DatePicker, Button, CardSection, Menu, IconButton } from '../../common';
import EmployeesPicker from './EmployeesPicker';
import {
  onCommerceReportValueChange,
  onCommerceReportValueReset,
  onMostPopularShiftsReadByRange
} from '../../../actions/CommerceReportsActions';

const pickerWidth = Math.round(Dimensions.get('window').width) / 3.1;

class MostPopularShiftsChart extends Component {
  constructor(props) {
    super(props);
    const { commerceId, startDate, endDate } = props;

    props.onMostPopularShiftsReadByRange(commerceId, startDate, endDate);

    this.state = {
      modal: false,
      modalStartDate: startDate,
      modalEndDate: endDate,
      selectedEmployee: { id: null }
    };
  }

  static navigationOptions = ({ navigation }) => {
    return { headerRight: navigation.getParam('rightIcon') };
  };

  componentDidMount() {
    this.props.navigation.setParams({
      rightIcon: <IconButton icon="md-create" onPress={() => this.setState({ modal: true })} />
    });
  }

  onGenerateReportPress = () => {
    this.props.onMostPopularShiftsReadByRange(
      this.props.commerceId,
      moment(this.state.modalStartDate),
      moment(this.state.modalEndDate),
      this.state.selectedEmployee.id
    );

    this.props.onCommerceReportValueChange({
      startDate: moment(this.state.modalStartDate),
      endDate: moment(this.state.modalEndDate),
      selectedEmployee: this.state.selectedEmployee
    });

    this.setState({ modal: false });
  };

  getChartTitle = () => {
    let title = 'Horarios con mayor demanda '

    if (this.props.selectedEmployee.id)
      title += `de ${this.props.selectedEmployee.name} `;

    return title + 'entre el ' + this.props.startDate.format('DD/MM/YYYY') +
      ' y el ' + this.props.endDate.format('DD/MM/YYYY');
  }

  renderChart = () => {
    const dataBar = {
      labels: this.props.data.labels,
      datasets: [{ data: this.props.data.data }]
    };

    return (
      <BarChart
        title={this.getChartTitle()}
        emptyDataMessage="Parece que no hay reservas en el periodo ingresado"
        xlabel="HORARIOS"
        data={dataBar}
      />
    );
  };

  render() {
    if (this.props.loading) return <Spinner />;

    return (
      <ScrollView>
        <Menu
          title="Seleccionar Periodo"
          isVisible={this.state.modal}
          onBackdropPress={() =>
            this.setState({
              modal: false,
              modalStartDate: this.props.startDate,
              modalEndDate: this.props.endDate
            })
          }
        >
          <CardSection
            style={{
              flexDirection: 'row',
              justifyContent: 'space-around',
              paddingTop: 10
            }}
          >
            <DatePicker
              date={this.state.modalStartDate}
              mode="date"
              label="Desde:"
              placeholder="Fecha desde"
              pickerWidth={pickerWidth}
              onDateChange={modalStartDate => this.setState({ modalStartDate })}
            />
            <DatePicker
              date={this.state.modalEndDate}
              mode="date"
              label="Hasta:"
              placeholder="Opcional"
              pickerWidth={pickerWidth}
              onDateChange={modalEndDate => this.setState({ modalEndDate })}
            />
          </CardSection>

          <EmployeesPicker
            value={this.state.selectedEmployee.id}
            onPickerValueChange={selectedEmployee => this.setState({ selectedEmployee })}
          />

          <CardSection>
            <Button title={'Generar Reporte'} onPress={this.onGenerateReportPress} />
          </CardSection>
        </Menu>

        {this.renderChart()}
      </ScrollView>
    );
  }
}

const mapStateToProps = state => {
  const { labels, data, startDate, endDate, selectedEmployee, loading } = state.commerceReports;
  const { commerceId } = state.commerceData;

  return {
    labels,
    data,
    startDate,
    endDate,
    commerceId,
    selectedEmployee,
    loading
  };
};

export default connect(mapStateToProps, {
  onCommerceReportValueChange,
  onCommerceReportValueReset,
  onMostPopularShiftsReadByRange
})(MostPopularShiftsChart);
