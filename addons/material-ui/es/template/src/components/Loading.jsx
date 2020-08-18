import React from '../../../../ts/template/src/components/node_modules/react';
import { makeStyles } from '../../../../ts/template/src/components/node_modules/@material-ui/core/styles';
import CircularProgress from '../../../../ts/template/src/components/node_modules/@material-ui/core/CircularProgress';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    '& > * + *': {
      marginLeft: theme.spacing(2),
    },
  },
}));

const Loading = () => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <CircularProgress />
    </div>
  );
}


export default Loading;
