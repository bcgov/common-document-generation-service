const utils = require('../../../src/components/utils');

describe('determineCarboneErrorCode', () => {
  it('should return a 422 for expected error strings', () => {
    expect(utils.determineCarboneErrorCode('Formatter \\"convDe\\" does not exist. Do you mean \\"convDate\\"?"')).toEqual(422);
    expect(utils.determineCarboneErrorCode('Error: formatter "ifEkual" DOES NOT exist. Do you mean "ifEqual"?')).toEqual(422);
    expect(utils.determineCarboneErrorCode('Error: Cannot access parent object in "d.site...name" (too high)')).toEqual(422);
    expect(utils.determineCarboneErrorCode('cannot access parent object in whatever')).toEqual(422);
    expect(utils.determineCarboneErrorCode('Missing at least one showBegin or hideBegin')).toEqual(422);
    expect(utils.determineCarboneErrorCode('missing at least one showEnd or hideEnd')).toEqual(422);
  });

  it('should return a 500 for anything else', () => {
    expect(utils.determineCarboneErrorCode('XML not valid')).toEqual(500);
    expect(utils.determineCarboneErrorCode('')).toEqual(500);
    expect(utils.determineCarboneErrorCode('   ')).toEqual(500);
    expect(utils.determineCarboneErrorCode(null)).toEqual(500);
    expect(utils.determineCarboneErrorCode(undefined)).toEqual(500);
    expect(utils.determineCarboneErrorCode([])).toEqual(500);
    expect(utils.determineCarboneErrorCode({})).toEqual(500);
  });
});

describe('prettyStringify', () => {
  const obj = {
    foo: 'bar'
  };

  it('should return a formatted json string with 2 space indent', () => {
    const result = utils.prettyStringify(obj);

    expect(result).toBeTruthy();
    expect(result).toEqual('{\n  "foo": "bar"\n}');
  });

  it('should return a formatted json string with 4 space indent', () => {
    const result = utils.prettyStringify(obj, 4);

    expect(result).toBeTruthy();
    expect(result).toEqual('{\n    "foo": "bar"\n}');
  });
});

describe('getFileExtension', () => {
  it('should return a the file extension when there is one', () => {
    expect(utils.getFileExtension('abc_123.docx')).toEqual('docx');
    expect(utils.getFileExtension('my file name here.docx')).toEqual('docx');
    expect(utils.getFileExtension('file.name.with.dots.docx')).toEqual('docx');
    expect(utils.getFileExtension('mx_permit_{d.permitNumber}.docx')).toEqual('docx');
  });

  it('should return undefined if no extension', () => {
    expect(utils.getFileExtension('abc_123')).toEqual(undefined);
    expect(utils.getFileExtension('')).toEqual(undefined);
    expect(utils.getFileExtension('   ')).toEqual(undefined);
    expect(utils.getFileExtension(null)).toEqual(undefined);
    expect(utils.getFileExtension(undefined)).toEqual(undefined);
  });
});


describe('determineOutputReportName', () => {
  it('should return the specified output file name with the specified extension', () => {
    const template = {
      contentFileType: 'docx',
      outputFileType: 'pdf',
      outputFileName: 'abc_123_{d.firstname}-{d.lastname}',
    };
    expect(utils.determineOutputReportName(template)).toMatch('abc_123_{d.firstname}-{d.lastname}.pdf');
  });

  it('should return the specified output file name with the input extension if no output specified', () => {
    const template = {
      contentFileType: 'xlsx',
      outputFileName: 'abc_123_{d.firstname}-{d.lastname}',
    };
    expect(utils.determineOutputReportName(template)).toMatch('abc_123_{d.firstname}-{d.lastname}.xlsx');
  });

  it('should return random uuid as the output file name if none specified, with the specified extension', () => {
    const template = {
      contentFileType: 'odt',
      outputFileType: 'pdf'
    };
    expect(utils.determineOutputReportName(template)).toMatch(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}.pdf/);

  });

  it('should return random uuid as the output file name if none specified, with input extension if no output specified', () => {
    const template = {
      contentFileType: 'docx'
    };
    expect(utils.determineOutputReportName(template)).toMatch(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}.docx/);

  });
});

describe('truthy', () => {
  it('should return false with invalid name', () => {
    expect(utils.truthy({})).toBeFalsy();
  });

  it('should return false with non-existent name attribute', () => {
    expect(utils.truthy('foo', {})).toBeFalsy();
  });

  it('should return false with falsy attribute', () => {
    expect(utils.truthy('foo', { foo: false })).toBeFalsy();
  });

  it('should return true with boolean true', () => {
    expect(utils.truthy('foo', { foo: true })).toBeTruthy();
  });

  it('should return true with string true', () => {
    expect(utils.truthy('foo', { foo: 'true' })).toBeTruthy();
  });

  it('should return true with string one', () => {
    expect(utils.truthy('foo', { foo: '1' })).toBeTruthy();
  });

  it('should return true with string yes', () => {
    expect(utils.truthy('foo', { foo: 'yes' })).toBeTruthy();
  });

  it('should return true with string y', () => {
    expect(utils.truthy('foo', { foo: 'y' })).toBeTruthy();
  });

  it('should return true with string t', () => {
    expect(utils.truthy('foo', { foo: 't' })).toBeTruthy();
  });

  it('should return true with integer one', () => {
    expect(utils.truthy('foo', { foo: 1 })).toBeTruthy();
  });
});
