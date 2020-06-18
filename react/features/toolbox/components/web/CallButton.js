//@flow

import React, { Component } from 'react'
import { connect } from '../../../base/redux';
import AbstractButton from '../../../base/toolbox/components/AbstractButton';
import type { AbstractButtonProps } from '../../../base/toolbox';
import { IconMicDisabled, IconMicrophone } from '../../../base/icons';
type Props = AbstractButtonProps & {

    /**
     * Whether audio is currently muted or not.
     */
    _audioMuted: boolean,

    /**
     * Whether the button is disabled.
     */
    _disabled: boolean,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function,
    /**
     * Local participant who is making the call
     */
    localParticipant: Object
}
class CallButton extends AbstractButton<Props, State> {
    _isMounted: boolean;
    icon = IconMicrophone;
    toggledIcon = IconMicDisabled;
    /**
    * Initializes a new {@code CallButton} instance.
    *
    * @param {Object} props - The read-only properties with which the new
    * instance is to be initialized.
    */
    constructor(props) {
        super(props);

        this._isMounted = true;
        this.state = {

        };
    }

    /**
   * Implements React's {@link Component#componentWillUnmount}.
   *
   * @inheritdoc
   */
    componentWillUnmount() {
        this._isMounted = false;
    }

    render() {

        return (super.render())
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @returns {Object}
 */
function mapStateToProps(state) {
    return {

    };
}

const mapDispatchToProps = {

};

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(CallButton);
