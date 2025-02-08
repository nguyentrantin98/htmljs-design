import React, { useState, useEffect } from 'react';
import DropdownComponent from './DropdownComponent';
import { LangSelect } from '../../lib';

const LangComponent = () => {
  const [currentImg, setCurrentImg] = useState('/assets/images/icons-vi.png');
  useEffect(() => {
    const cul = localStorage.getItem('Culture') || 'en';
    setCurrentImg(`/assets/images/icons-${cul}.png`);
  }, []);

  const calcLang = (data, cul) => {
    const map = data
      .filter((x) => x.LangCode == cul)
      .reduce((acc, cur) => {
        acc[cur.Key] = cur.Value;
        return acc;
      }, {});
    if (!LangSelect.Culture) {
      LangSelect.Culture = cul;
    }
    LangSelect._dictionaries = map;
    return map;
  };
  /**
   * @param {HTMLElement} node
   * @returns {HTMLElement[]}
   */
  function* Travel(node) {
    for (const element of node.childNodes) {
      yield element;
      yield* Travel(element);
    }
  }

  const handleClick = (event, cul) => {
    setCurrentImg(`/assets/images/icons-${cul}.png`);
    localStorage.setItem('Culture', cul);
    var dictionary = JSON.parse(localStorage.getItem('Dictionary'));
    var dictionaryItems = calcLang(dictionary, cul);
    Travel(document.documentElement).forEach((item) => {
      const props = item['langprop'];
      if (props === null || props === undefined || props === '') {
        return;
      }
      props.split(',').forEach((propName) => {
        const template = item['langkey' + propName];
        const featurename = item['featurename'];
        if (dictionaryItems[template + '_' + featurename]) {
          const translated =
            dictionaryItems[template + '_' + featurename] !== undefined
              ? dictionaryItems[template + '_' + featurename]
              : template;
          item[propName] = translated;
        } else {
          const translated =
            dictionaryItems[template] !== undefined
              ? dictionaryItems[template]
              : template;
          item[propName] = translated;
        }
      });
    });
  };

  const toggleContent = (
    <>
      <img width={'31px'} src={currentImg} alt="user" srcSet="" />
    </>
  );

  const dropdownContent = (
    <>
      <a
        onClick={(e) => handleClick(e, 'vi')}
        className="dropdown-item"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <img
          width={'31px'}
          src="/assets/images/icons-vi.png"
          alt="vi"
          srcSet=""
        />
        VIỆT NAM
      </a>
      <a
        onClick={(e) => handleClick(e, 'en')}
        className="dropdown-item"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <img
          width={'31px'}
          src="/assets/images/icons-en.png"
          alt="en"
          srcSet=""
        />
        ENGLISH
      </a>
    </>
  );

  return (
    <DropdownComponent
      toggleContent={toggleContent}
      dropdownContent={dropdownContent}
      className="user-dropdown dropdown-menu-end"
    />
  );
};

export default LangComponent;
