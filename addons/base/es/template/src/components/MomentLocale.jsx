import moment from 'moment-timezone';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const MomentLocale = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    moment.locale(i18n.language);
  }, []);

  return null;
};

export default MomentLocale;
