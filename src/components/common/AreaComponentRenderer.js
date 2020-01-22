import { AREAS } from '../../constants';
import { connect } from 'react-redux';

const AreaComponentRenderer = connect(
    mapStateToProps, null
)(
    props => {
        switch (props.area || props.areaId) {
            case AREAS.sports:
                return props.sports;
            case AREAS.hairdressers:
                return props.hairdressers;
            default:
                return props.sports;
        }
    }
);

const mapStateToProps = state => {
    return { areaId: state.commerceData.area.areaId };
}

export { AreaComponentRenderer };