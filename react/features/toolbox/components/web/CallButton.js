//@flow

import React, { Component } from 'react'
import { connect } from '../../../base/redux';
import AbstractButton from '../../../base/toolbox/components/AbstractButton';
import type { AbstractButtonProps } from '../../../base/toolbox';
import { IconMicDisabled, IconMicrophone } from '../../../base/icons';
import { db } from '../../../base/config/firebase'

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
    localParticipant: Object,
    /**
     * Name of conference the participant is part of
     */
    roomName: string
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
            writeError: false,
            disabled: false
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

    async handleSendCall() {

        this.setState({ writeError: null });
        try {
            await db.ref("calls").push({
                roomName: this.props.roomName,
                timestamp: Date.now(),
                uid: this.props.localParticipant.id,
                name: this.props.localParticipant.name ? this.props.localParticipant.name : 'Random Participant'
            }, (err) => {
                if (err) {
                    console.log(err);
                }
                else {
                    console.log('Call Made!')
                }

            });

        } catch (error) {
            this.setState({ writeError: error.message });
        }
    }

    _handleClick() {
        this.setState({ disabled: true })
        this.handleSendCall();
    }


    _isDisabled() {
        return this.state.disabled;
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
