import React from "react";
import { Form, Input, Button } from "antd";
import axios from "axios";
import { InputValue } from "./types";
interface InputProps {
  onSubmit: (param: any) => void;
}
const InputFrom = (props: InputProps) => {
  const { onSubmit } = props;
  // 测试存储结束
  const layout = {
    labelCol: { span: 8 },
    wrapperCol: { span: 16 },
  };
  const tailLayout = {
    wrapperCol: { offset: 8, span: 16 },
  };
  const [form] = Form.useForm();
  const onFinish = (values: any) => {
    form
      .validateFields()
      .then((values: InputValue) => {
        console.log(values);
        axios
          .post("http://localhost:8080/api/v1/h264streams", {
            ipcam: [values],
          })
          .then(function (response) {
            console.log(response);
            onSubmit(response);
          })
          .catch(function (error) {
            console.log(error);
          });
      })
      .catch((errorInfo: any) => {
        console.log(errorInfo);
      });
  };

  const onReset = () => {
    form.resetFields();
    // axios
    //   .post("http://localhost:8080/api/v1/h264streams", {
    //     // .post("http://" + window.location.hostname + ":8080/api/v1/h264streams", {
    //     ipcam: [
    //       {
    //         address: "10.12.240.40",
    //         port: "80",
    //         user: "admin",
    //         password: "JDC_IoT0537",
    //       },
    //     ],
    //   })
    //   .then(function (response) {
    //     console.log(response);
    //     onSubmit(response);
    //   })
    //   .catch(function (error) {
    //     console.log(error);
    //   });
  };

  return (
    <Form
      {...layout}
      form={form}
      name="basic"
      initialValues={{ remember: true }}
      onFinish={onFinish}
      // onFinishFailed={onFinishFailed}
    >
      <Form.Item
        label="摄像头IP"
        name="address"
        rules={[{ required: true, message: "请输入摄像头IP!" }]}
      >
        <Input placeholder="请输入摄像头IP" />
      </Form.Item>

      <Form.Item
        label="端口号"
        name="port"
        rules={[{ required: true, message: "请输入端口号!" }]}
      >
        <Input placeholder="请输入端口号" />
      </Form.Item>
      <Form.Item
        label="用户名"
        name="user"
        rules={[{ required: true, message: "请输入用户名!" }]}
      >
        <Input placeholder="请输入用户名" />
      </Form.Item>
      <Form.Item
        label="密码"
        name="password"
        rules={[{ required: true, message: "请输入密码!" }]}
      >
        <Input placeholder="请输入密码" type="password" />
      </Form.Item>
      <Form.Item {...tailLayout}>
        <Button type="primary" htmlType="submit">
          确定
        </Button>
        <Button htmlType="button" onClick={onReset}>
          重置
        </Button>
      </Form.Item>
    </Form>
  );
};
export default InputFrom;
