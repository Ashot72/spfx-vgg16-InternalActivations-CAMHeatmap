import * as React from 'react';
import styles from './Spinner.module.scss';

const Spinner: React.SFC = () => {

    return (
        <div className={styles["lds-ring"]}>
            <div />
            <div />
            <div />
            <div />
        </div>
    )
}

export default Spinner